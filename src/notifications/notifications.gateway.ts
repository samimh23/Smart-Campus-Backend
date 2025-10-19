import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove user from connected users
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; role: string },
  ) {
    this.connectedUsers.set(data.userId, client.id);
    client.join(data.role); // Join role-based room
    console.log(`User ${data.userId} (${data.role}) joined`);
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket) {
    // Remove user from connected users
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  // Notify all students about new homework
  notifyNewHomework(homework: any) {
    console.log('🔔 Sending new homework notification to all students:', homework.title);
    this.server.to('STUDENT').emit('new_homework', {
      type: 'new_homework',
      data: homework,
      message: `Nouveau devoir: ${homework.title}`,
      timestamp: new Date().toISOString(),
    });
  }

  // Notify specific student about grade
  notifyGrade(studentId: string, grade: any) {
    const socketId = this.connectedUsers.get(studentId);
    if (socketId) {
      this.server.to(socketId).emit('new_grade', {
        type: 'new_grade',
        data: grade,
        message: `Vous avez reçu une note: ${grade.grade}/20`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Notify teacher about new submission
  notifyNewSubmission(teacherId: string, submission: any) {
    const socketId = this.connectedUsers.get(teacherId);
    if (socketId) {
      this.server.to(socketId).emit('new_submission', {
        type: 'new_submission',
        data: submission,
        message: `Nouvelle soumission pour: ${submission.homework.title}`,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
