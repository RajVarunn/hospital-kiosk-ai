import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  socket = null;

  connect() {
    this.socket = io(SOCKET_URL);
    
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Queue updates
  onQueueUpdate(callback) {
    if (this.socket) {
      this.socket.on('queue_update', callback);
    }
  }

  // Patient status updates
  onPatientUpdate(callback) {
    if (this.socket) {
      this.socket.on('patient_update', callback);
    }
  }

  // Join room for specific patient
  joinPatientRoom(patientId) {
    if (this.socket) {
      this.socket.emit('join_patient_room', patientId);
    }
  }
}

export default new SocketService();