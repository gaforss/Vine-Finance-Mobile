import React from 'react';
import {View, Text, StyleSheet, Modal, Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface DeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
}) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          <Icon
            name="exclamation-triangle"
            size={40}
            style={styles.warningIcon}
          />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>
          <View style={styles.alertBox}>
            <Icon
              name="exclamation-circle"
              size={16}
              style={styles.alertIcon}
            />
            <Text style={styles.alertText}>This action is NOT reversible!</Text>
          </View>
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.deleteButton]}
              onPress={onConfirm}>
              <Text style={styles.buttonText}>{confirmText || 'Delete'}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a3042',
    borderRadius: 8,
    padding: 25,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  warningIcon: {
    color: '#ffc107',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e0e0e0',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#a6b0cf',
    textAlign: 'center',
    marginBottom: 20,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  alertIcon: {
    color: '#f8d7da',
    marginRight: 10,
  },
  alertText: {
    color: '#f8d7da',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DeleteModal;
