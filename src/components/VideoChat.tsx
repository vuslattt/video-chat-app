"use client";

import { useState, useEffect, useRef } from "react";
import socket from "@/utils/socket"; // Burada socket.ts dosyasını kullanıyoruz

interface OfferData {
  offer: RTCSessionDescriptionInit;
  sender: string;
}

interface AnswerData {
  answer: RTCSessionDescriptionInit;
  sender: string;
}

interface IceCandidateData {
  candidate: RTCIceCandidateInit;
  sender: string;
}

export default function VideoChat() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    // Olay dinleyicileri
    socket.on("receive-offer", async (data: OfferData) => {
      if (!peerConnection.current) return;

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer", { roomId, answer });
    });

    socket.on("receive-answer", async (data: AnswerData) => {
      if (!peerConnection.current) return;

      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    });

    socket.on("receive-ice-candidate", async (data: IceCandidateData) => {
      if (!peerConnection.current) return;

      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(data.candidate)
      );
    });

    // Cleanup
    return () => {
      socket.off("receive-offer");
      socket.off("receive-answer");
      socket.off("receive-ice-candidate");
    };
  }, []);

  const startCall = async () => {
    if (!roomId.trim()) return;

    socket.emit("join-room", roomId);
    setJoined(true);

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => {
      if (peerConnection.current) {
        peerConnection.current.addTrack(track, stream);
      }
    });

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("offer", { roomId, offer });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      {!joined ? (
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Join a Video Chat Room</h2>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full p-2 border rounded-md mb-4"
          />
          <button
            onClick={startCall}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
          >
            Join Room
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-2xl flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4">Room: {roomId}</h2>
          <div className="w-full flex gap-4">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-1/2 rounded-md border"
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-1/2 rounded-md border"
            />
          </div>
          <button
            onClick={() => setJoined(false)}
            className="mt-4 bg-red-600 text-white p-2 rounded-md hover:bg-red-700"
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
}
