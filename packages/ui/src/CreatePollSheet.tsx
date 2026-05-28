import React, { useState } from 'react';
import { Button, Input, Sheet, Text, XStack, YStack, ScrollView, Switch, Label } from 'tamagui';
import { X, Plus, Trash2 } from '@tamagui/lucide-icons';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useCreatePollMutation } from 'app/services/chatApi';

// Định nghĩa đúng theo cấu trúc DTO bạn vừa làm ở BE
export type PollCreateRequest = {
  question: string;
  options: string[];
  multipleChoice: boolean;
  allowAddOption: boolean;
  deadline?: string;
};

type Props = {
  isOpen: boolean;
  roomId: string;
  onOpenChange: (open: boolean) => void;
};

export const CreatePollSheet = ({ isOpen, roomId, onOpenChange }: Props) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']); // Mặc định 2 ô trống
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [allowAddOption, setAllowAddOption] = useState(false);

  const [createPoll] = useCreatePollMutation();

  const handleCreatePollSubmit = async (pollData: PollCreateRequest) => {
    try {
      // 1. Gọi API Backend để tạo widget
      await createPoll({ roomId, data: pollData }).unwrap();

      console.log("Đã gửi dữ liệu tạo Poll:", pollData);
    } catch (error) {
      console.error("Lỗi khi tạo Poll", error);
      alert("Không thể tạo bình chọn lúc này!");
    }
  };

  const handleAddOption = () => {
    if (options.length >= 20) return; // Giới hạn 20 lựa chọn
    setOptions([...options, '']);
  };

  const handleRemoveOption = (indexToRemove: number) => {
    if (options.length <= 2) return; // Phải giữ lại ít nhất 2 ô
    setOptions(options.filter((_, index) => index !== indexToRemove));
  };

  const handleChangeOption = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    const trimmedQuestion = question.trim();
    const validOptions = options.map(o => o.trim()).filter(o => o.length > 0);

    if (!trimmedQuestion) {
      alert('Vui lòng nhập câu hỏi bình chọn!');
      return;
    }
    if (validOptions.length < 2) {
      alert('Vui lòng nhập ít nhất 2 lựa chọn!');
      return;
    }

    const pollData: PollCreateRequest = {
      question: trimmedQuestion,
      options: validOptions,
      multipleChoice,
      allowAddOption,
    };

    handleCreatePollSubmit(pollData);

    // Reset form sau khi gửi
    setQuestion('');
    setOptions(['', '']);
    setMultipleChoice(false);
    setAllowAddOption(false);
    onOpenChange(false); // Đóng sheet
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
        exitStyle={{ opacity: 0 }} />
      <Sheet.Handle />
      <Sheet.Frame flex={1} bg="$background" padding="$4" borderTopLeftRadius="$4" borderTopRightRadius="$4">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <YStack flex={1} space="$4">

            {/* Tiêu đề & Nút tắt */}
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$6" fontWeight="bold">Tạo bình chọn</Text>
              <Button size="$3" circular chromeless icon={X} onPress={() => onOpenChange(false)} />
            </XStack>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <YStack space="$4">

                {/* Câu hỏi */}
                <YStack space="$2">
                  <Label fontWeight="bold">Câu hỏi</Label>
                  <Input
                    placeholder="Đặt câu hỏi bình chọn..."
                    value={question}
                    onChangeText={setQuestion}
                    size="$4"
                    borderRadius="$3"
                  />
                </YStack>

                {/* Danh sách lựa chọn */}
                <YStack space="$3">
                  <Label fontWeight="bold">Các lựa chọn</Label>
                  {options.map((option, index) => (
                    <XStack key={index} space="$2" marginBottom="$2" alignItems="center">
                      <Input
                        flex={1}
                        placeholder={`Lựa chọn ${index + 1}`}
                        value={option}
                        onChangeText={(text) => handleChangeOption(text, index)}
                        size="$4"
                        borderRadius="$3"
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

                {/* Các tuỳ chọn (Cấu hình) */}
                <YStack space="$3" mt="$4" p="$3" bg="$color3" borderRadius="$4">
                  <XStack alignItems="center" space="$4">
                    <Switch size="$2" checked={multipleChoice} onCheckedChange={setMultipleChoice}>
                      <Switch.Thumb animation="quick" />
                    </Switch>
                    <Label flex={1} onPress={() => setMultipleChoice(!multipleChoice)}>
                      Cho phép chọn nhiều phương án
                    </Label>
                  </XStack>

                  <XStack alignItems="center" space="$4">
                    <Switch size="$2" checked={allowAddOption} onCheckedChange={setAllowAddOption}>
                      <Switch.Thumb animation="quick" />
                    </Switch>
                    <Label flex={1} onPress={() => setAllowAddOption(!allowAddOption)}>
                      Thành viên có thể thêm lựa chọn
                    </Label>
                  </XStack>
                </YStack>

              </YStack>
            </ScrollView>

            {/* Nút Submit */}
            <Button size="$5" theme="blue" borderRadius="$4" onPress={handleSubmit}>
              <Text color="white" fontWeight="bold">Tạo bình chọn</Text>
            </Button>

          </YStack>
        </KeyboardAvoidingView>
      </Sheet.Frame>
    </Sheet>
  );
};