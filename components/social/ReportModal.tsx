import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { ContentType, ReportType, REPORT_TYPE_LABELS } from '@/types/report';
import { useReport } from '@/hooks/useReport';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  contentId: string;
  contentType: ContentType;
  contentTitle?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  contentId,
  contentType,
  contentTitle,
}) => {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const reportMutation = useReport();

  const handleSubmit = async () => {
    if (!selectedType) return;

    try {
      await reportMutation.mutateAsync({
        content_id: contentId,
        content_type: contentType,
        report_type: selectedType,
        description: description.trim() || undefined,
      });
      onClose();
      // Reset state
      setSelectedType(null);
      setDescription('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedType(null);
    setDescription('');
  };

  const isPost = contentType === ContentType.POST;
  const isComment = contentType === ContentType.COMMENT;
  const isUser = contentType === ContentType.USER;
  const isMessage = contentType === ContentType.MESSAGE;

  let title = "Báo cáo";
  if (isPost) title = "Báo cáo bài viết";
  if (isComment) title = "Báo cáo bình luận";
  if (isUser) title = "Báo cáo người dùng";
  if (isMessage) title = "Báo cáo tin nhắn";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{title}</Text>
              {contentTitle && (
                <Text style={styles.contentTitlePreview} numberOfLines={1}>
                  "{contentTitle}"
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardOpeningTime={0}
          >
            <Text style={styles.sectionTitle}>Tại sao bạn báo cáo nội dung này?</Text>
            <Text style={styles.sectionSubtitle}>
              Báo cáo của bạn là ẩn danh. Nếu ai đó đang gặp nguy hiểm, hãy gọi cho dịch vụ khẩn cấp địa phương ngay lập tức.
            </Text>

            {Object.entries(REPORT_TYPE_LABELS).map(([type, label]) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.reasonItem,
                  selectedType === type && styles.reasonItemActive,
                ]}
                onPress={() => setSelectedType(type as ReportType)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.reasonLabel,
                    selectedType === type && styles.reasonLabelActive,
                  ]}
                >
                  {label}
                </Text>
                {selectedType === type && (
                  <Ionicons name="checkmark-circle" size={20} color="#34B27D" />
                )}
              </TouchableOpacity>
            ))}

            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>
                {selectedType === ReportType.OTHER ? 'Thêm chi tiết (bắt buộc)' : 'Thêm chi tiết (không bắt buộc)'}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Hãy cho chúng tôi biết thêm..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedType || reportMutation.isPending || (selectedType === ReportType.OTHER && !description.trim())) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedType || reportMutation.isPending || (selectedType === ReportType.OTHER && !description.trim())}
              >
                <Text style={styles.submitButtonText}>
                  {reportMutation.isPending ? "Đang gửi..." : "Gửi báo cáo"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  contentTitlePreview: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reasonItemActive: {
    borderColor: '#34B27D',
    backgroundColor: '#F0FDF4',
  },
  reasonLabel: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  reasonLabelActive: {
    color: '#065F46',
    fontWeight: '600',
  },
  descriptionContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    minHeight: 100,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  submitButton: {
    backgroundColor: '#34B27D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
