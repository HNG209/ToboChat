import React, { useEffect, useState } from 'react';
import { Button, Input, Sheet, Text, XStack, YStack, ScrollView, Switch, Label, Spinner } from 'tamagui';
import { X, Plus, Trash2, Sparkles, Paperclip, Send } from '@tamagui/lucide-icons';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useCreatePollMutation, useGeneratePollMutation, useLazyGetPresignedUrlQuery, useUpdatePollMutation } from 'app/services/chatApi';
import { MessageResponse } from 'app/types/Response';
import { useGetProfileQuery } from 'app/services/userApi';
import { getSocket } from 'app/utils/socket';
import { useDocumentUpload } from 'app/hooks/useDocumentUpload';
export type PollOptionDto = {
  id?: string;
  text: string;
};

export type PollSubmitRequest = { // create + update chung 1 type
  question: string;
  options: PollOptionDto[];
  multipleChoice: boolean;
  allowAddOption: boolean;
  deadline?: string;
};

export type PollGenerateRequest = {
  prompt: string;
  fileUrl?: string; // URL file đính kèm (nếu có)
}

type Props = {
  isOpen: boolean;
  roomId: string;
  initialPoll?: MessageResponse | null; // Truyền thẳng object Poll vào đây
  onOpenChange: (open: boolean) => void;
};

export const CreatePollSheet = ({ isOpen, roomId, initialPoll, onOpenChange }: Props) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOptionDto[]>([{ text: '' }, { text: '' }]);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [allowAddOption, setAllowAddOption] = useState(false);

  const { data: currentUser } = useGetProfileQuery()
  const [createPoll, { isLoading: isCreating }] = useCreatePollMutation();
  const [updatePoll, { isLoading: isUpdating }] = useUpdatePollMutation();
  const [getPresignedUrl] = useLazyGetPresignedUrlQuery();
  const [generatePoll] = useGeneratePollMutation();

  const { pick } = useDocumentUpload();
  const [attachedFile, setAttachedFile] = useState<{ name: string, url: string } | null>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const isCreator = initialPoll?.user && initialPoll.user.id === currentUser?.id;
  const isEditMode = !!initialPoll;
  const isDisabledSettings = isEditMode && !isCreator;

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isOpen) return;

    const handleAiGenerated = (data: any) => {
      if (data.question) setQuestion(data.question);
      if (data.options && Array.isArray(data.options)) {
        setOptions(data.options.map((opt: any) => ({ text: opt.text })));
      }
      setIsAiLoading(false);
      setAiPrompt('');
    };

    const handleAiError = () => {
      setIsAiLoading(false);
      alert("AI đang bận, vui lòng thử lại sau!");
    };

    socket.on('poll_generated', handleAiGenerated);
    socket.on('poll_generated_error', handleAiError);

    return () => {
      socket.off('poll_generated', handleAiGenerated);
      socket.off('poll_generated_error', handleAiError);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialPoll && initialPoll.metadata?.pollData) {
      // NẾU LÀ CHẾ ĐỘ SỬA: Parse dữ liệu từ object truyền vào
      try {
        const parsedData = JSON.parse(initialPoll.metadata.pollData);
        setQuestion(parsedData.question || '');

        if (parsedData.options && parsedData.options.length > 0) {
          setOptions(parsedData.options.map((o: any) => ({ id: o.id, text: o.text })));
        }

        setMultipleChoice(parsedData.multipleChoice || false);
        setAllowAddOption(parsedData.allowAddOption || false);
      } catch (error) {
        console.error("Lỗi parse dữ liệu Poll để sửa:", error);
      }
    } else if (isOpen && !initialPoll) {
      // NẾU LÀ CHẾ ĐỘ TẠO MỚI: Reset form cho sạch sẽ
      setQuestion('');
      setOptions([{ text: '' }, { text: '' }]);
      setMultipleChoice(false);
      setAllowAddOption(false);
    }
  }, [isOpen, initialPoll]);

  const handleAddOption = () => {
    if (options.length >= 20) return;
    setOptions([...options, { text: '' }]);
  };

  const handleRemoveOption = (indexToRemove: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, index) => index !== indexToRemove));
  };

  const handleChangeOption = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const handleAskAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);

    try {
      await generatePoll({ prompt: aiPrompt, fileUrl: attachedFile?.url }).unwrap();
    } catch (error) {
      setIsAiLoading(false);
      alert("Lỗi kết nối Server");
    }
  };

  const handleAttachFile = async () => {
    try {
      const selectedFile = await pick();
      if (!selectedFile) return;

      setIsUploadingFile(true);

      // Lấy Presigned URL từ Backend
      const presignedRes = await getPresignedUrl({
        roomId,
        fileName: selectedFile.name,
        contentType: selectedFile.type || 'application/pdf',
      }).unwrap();

      const uploadUrl = presignedRes.uploadUrl;
      const finalFileUrl = presignedRes.fileUrl;

      // Xử lý file body để đẩy lên S3 (cho cả Web và Native)
      let bodyToUpload: any;

      if (Platform.OS === 'web' && selectedFile.file) {
        // Trên web, nhét thẳng object File gốc vào
        bodyToUpload = selectedFile.file;
      } else {
        // Trên Mobile, đọc file từ URI thành dạng Blob
        const response = await fetch(selectedFile.uri);
        bodyToUpload = await response.blob();
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: bodyToUpload,
        headers: {
          'Content-Type': selectedFile.type || 'application/pdf',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Lỗi tải lên S3: " + uploadResponse.statusText);
      }

      setAttachedFile({ name: selectedFile.name, url: finalFileUrl });
    } catch (error) {
      console.error("Lỗi đính kèm file:", error);
      alert("Đính kèm file thất bại! Vui lòng thử lại.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  const handleSubmit = async () => {
    const trimmedQuestion = question.trim();
    const validOptions = options
      .map(o => ({ ...o, text: o.text.trim() }))
      .filter(o => o.text.length > 0);

    if (!trimmedQuestion) {
      alert('Vui lòng nhập câu hỏi bình chọn!');
      return;
    }
    if (validOptions.length < 2) {
      alert('Vui lòng nhập ít nhất 2 lựa chọn hợp lệ!');
      return;
    }

    const pollData: PollSubmitRequest = {
      question: trimmedQuestion,
      options: validOptions,
      multipleChoice,
      allowAddOption,
    };

    try {
      if (isEditMode && initialPoll) {
        await updatePoll({ roomId, pollId: initialPoll.id, data: pollData }).unwrap();
      } else {
        await createPoll({ roomId, data: pollData }).unwrap();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Lỗi khi xử lý Poll:", error);
      alert(isEditMode ? "Không thể cập nhật bình chọn!" : "Không thể tạo bình chọn lúc này!");
    }
  };

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={onOpenChange}
      snapPointsMode='percent'
      snapPoints={[85, 50, 25]}
      dismissOnSnapToBottom
      zIndex={100_000}
      animation="medium"
    >
      <Sheet.Overlay
        animation="quick"
        transition="lazy"
        bg="$shadow6"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Handle />
      <Sheet.Frame flex={1} bg="$background" padding="$4" borderTopLeftRadius="$4" borderTopRightRadius="$4">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <YStack flex={1} space="$4">

            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$6" fontWeight="bold">
                {isEditMode ? 'Cập nhật bình chọn' : 'Tạo bình chọn'}
              </Text>
              <Button size="$3" circular chromeless icon={X} onPress={() => onOpenChange(false)} />
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <YStack space="$2">

                {!isEditMode && (
                  <YStack space="$2" mb="$4" p="$3" bg="$purple2" borderRadius="$4" borderWidth={1} borderColor="$purple5">
                    <XStack alignItems="center" space="$2">
                      <Sparkles size={16} color="$purple10" />
                      <Label fontWeight="bold" color="$purple10" m={0}>Trợ lý AI tạo bình chọn</Label>
                    </XStack>

                    <XStack space="$2" alignItems="center">
                      <Input
                        flex={1}
                        multiline
                        placeholder="VD: Gợi ý món ăn trưa..."
                        value={aiPrompt}
                        onChangeText={setAiPrompt}
                        bg="$background"
                        disabled={isAiLoading}
                      />

                      {/* Nút Đính kèm file */}
                      {!attachedFile && (
                        <Button
                          size="$3"
                          circular
                          chromeless
                          icon={<Paperclip size={20} color="$color10" />}
                          disabled={isAiLoading || isUploadingFile || (!aiPrompt.trim() && !attachedFile)}
                          onPress={handleAttachFile}
                        />
                      )}

                      {/* Nút Gửi Prompt */}
                      <Button
                        size="$3"
                        circular
                        bg="$purple10"
                        color="white"
                        icon={isAiLoading ? <Spinner color="white" /> : <Send size={16} />}
                        onPress={handleAskAi}
                        disabled={isAiLoading || !aiPrompt.trim()}
                      />
                    </XStack>

                    {/* HIỂN THỊ TRẠNG THÁI LOADING UPLOAD */}
                    {isUploadingFile && (
                      <XStack alignItems="center" space="$2" mt="$2" p="$2" bg="$gray3" borderRadius="$3">
                        <Spinner size="small" color="$gray10" />
                        <Text fontSize="$2" color="$gray11" flex={1}>Đang tải tài liệu lên an toàn...</Text>
                      </XStack>
                    )}

                    {/* HIỂN THỊ FILE ĐÃ ĐÍNH KÈM THÀNH CÔNG */}
                    {attachedFile && !isUploadingFile && (
                      <XStack alignItems="center" space="$2" mt="$2" p="$2" bg="$purple3" borderRadius="$3" borderWidth={1} borderColor="$purple5">
                        <Paperclip size={14} color="$purple10" />
                        <Text fontSize="$2" color="$purple11" flex={1} numberOfLines={1}>{attachedFile.name}</Text>
                        <Button size="$2" circular chromeless icon={<X size={16} color="$purple10" />} onPress={handleRemoveFile} disabled={isAiLoading} />
                      </XStack>
                    )}
                  </YStack>
                )}

                <YStack space="$2">
                  <Label fontWeight="bold">Câu hỏi</Label>
                  <Input
                    placeholder="Đặt câu hỏi bình chọn..."
                    value={question}
                    onChangeText={setQuestion}
                    size="$4"
                    borderRadius="$3"
                    multiline
                  />
                </YStack>

                <YStack space="$3">
                  <Label fontWeight="bold">Các lựa chọn</Label>
                  {options.map((option, index) => (
                    <XStack key={index} space="$2" marginBottom="$2" alignItems="center">
                      <Input
                        flex={1}
                        placeholder={`Lựa chọn ${index + 1}`}
                        value={option.text}
                        onChangeText={(text) => handleChangeOption(text, index)}
                        size="$4"
                        borderRadius="$3"
                        multiline
                      />
                      {options.length > 2 && (
                        <Button
                          size="$4"
                          chromeless
                          icon={<Trash2 size={20} color="$red10" />}
                          onPress={() => handleRemoveOption(index)}
                        />
                      )}
                    </XStack>
                  ))}

                  {options.length < 20 && (
                    <Button
                      icon={<Plus size={18} />}
                      onPress={handleAddOption}
                      theme="blue"
                      variant="outlined"
                      alignSelf="flex-start"
                      borderRadius="$3"
                      size="$3"
                    >
                      Thêm lựa chọn
                    </Button>
                  )}
                </YStack>

                <YStack space="$3" mt="$4" p="$3" bg="$color3" borderRadius="$4">
                  <XStack alignItems="center" space="$4">
                    <Switch
                      size="$2"
                      checked={multipleChoice}
                      onCheckedChange={setMultipleChoice}
                      bg={multipleChoice ? '$blue9' : '$color5'}
                      disabled={isDisabledSettings} // Chỉ creator mới có quyền bật/tắt multiple choice, và chỉ khi đang tạo mới (edit mode thì không cho chỉnh)
                      opacity={isDisabledSettings ? 0.5 : 1}
                    >
                      <Switch.Thumb animation="quick" backgroundColor="white" />
                    </Switch>
                    <Label flex={1} onPress={() => setMultipleChoice(!multipleChoice)}>
                      Cho phép chọn nhiều phương án
                    </Label>
                  </XStack>

                  <XStack alignItems="center" space="$4">
                    <Switch
                      size="$2"
                      checked={allowAddOption}
                      onCheckedChange={setAllowAddOption}
                      bg={allowAddOption ? '$blue9' : '$color5'}
                      disabled={isDisabledSettings} // Chỉ creator mới có quyền bật/tắt allow add option, và chỉ khi đang tạo mới (edit mode thì không cho chỉnh)
                      opacity={isDisabledSettings ? 0.5 : 1}
                    >
                      <Switch.Thumb animation="quick" backgroundColor="white" />
                    </Switch>
                    <Label flex={1} onPress={() => setAllowAddOption(!allowAddOption)}>
                      Cho phép người khác thêm lựa chọn
                    </Label>
                  </XStack>

                </YStack>

              </YStack>
            </ScrollView>

            <Button size="$5" backgroundColor="$blue10" borderRadius="$4" onPress={handleSubmit}>
              {
                (isCreating || isUpdating) ?
                  <Spinner size="small" color="white" />
                  :
                  <Text color="white" fontWeight="bold">
                    {isEditMode ? 'Lưu thay đổi' : 'Tạo bình chọn'}
                  </Text>
              }
            </Button>

          </YStack>
        </KeyboardAvoidingView>
      </Sheet.Frame>
    </Sheet>
  );
};