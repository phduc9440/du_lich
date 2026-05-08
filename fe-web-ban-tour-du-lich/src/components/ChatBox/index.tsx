import React, { useEffect, useRef, useState } from 'react';
import {
    Avatar,
    Input,
    Button,
    Typography,
    Flex,
    Divider,
    Card,
} from 'antd';
import {
    RobotOutlined,
    UserOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import type { InputRef } from 'antd';
import iconMessage from '../../assets/imgs/iconMessage.png';
import { useSendMessageChatMutation } from '../../services/chatService';

const { Text } = Typography;

type Message = {
    id: number;
    sender: 'user' | 'bot';
    content: string;
    timestamp: string;
};

interface ChatBoxProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({
    open,
    setOpen,
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            sender: 'bot',
            content: 'Xin chào tôi có thể giúp gì cho bạn?',
            timestamp: new Date().toLocaleTimeString(),
        },
    ]);
    const [input, setInput] = useState('');
    const messageEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<InputRef>(null);
    const sendMessageApi = useSendMessageChatMutation();
    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now(),
            sender: 'user',
            content: input.trim(),
            timestamp: new Date().toLocaleTimeString(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        const botReply = await sendMessageApi.mutateAsync({sender: 'user_1', message: input.trim() })

        // bot trả lời
        const botMsg: Message = {
            id: Date.now() + 1,
            sender: 'bot',
            content: botReply[0]?.text || 'Xin lỗi, tôi chưa hiểu câu hỏi',
            timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, botMsg]);
    };

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    useEffect(() => {
        if (open) {
            inputRef.current?.focus();
        }
    }, [open]);

    return (
        <Card
            className={`fixed right-5 bottom-12 z-[1000] shadow-lg ${open ? 'block' : 'hidden'
                }`}
            style={{ width: 380, height: '90vh', borderRadius: 8 }}
            styles={{
                body: {
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 8,
                },
            }}
        >
            {/* Header */}
            <Flex
                align="center"
                justify="space-between"
                className="px-4 pt-4 pb-0"
            >
                <Text strong className="text-lg">
                    Hỗ Trợ
                </Text>
                <CloseOutlined
                    className="cursor-pointer hover:text-red-500"
                    onClick={() => setOpen(false)}
                />
            </Flex>
            <Divider className="my-2" />

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 bg-[#F0F0F3]">
                {messages.map((item) => (
                    <div
                        key={item.id}
                        className={`flex mb-2 ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {item.sender === 'bot' && <Avatar icon={<RobotOutlined />} />}
                        <div
                            className={`max-w-[70%] mx-2 px-3 py-2 rounded-2xl shadow ${item.sender === 'user'
                                ? 'bg-[#1565C0] text-white ml-2'
                                : 'bg-white text-black mr-2'
                                }`}
                        >
                            <div>{item.content}</div>
                            <Text
                                type="secondary"
                                className={`block text-[10px] mt-1 ${item.sender === 'user' ? 'text-right' : 'text-left'
                                    }`}
                            >
                                {item.timestamp}
                            </Text>
                        </div>
                        {item.sender === 'user' && <Avatar icon={<UserOutlined />} />}
                    </div>
                ))}
                <div ref={messageEndRef} />
            </div>

            {/* Input */}
            <div className="py-4 border-t border-gray-200">
                <Flex align="center" gap={8}>
                    <Input

                        placeholder={'Nhập tin nhắn...'}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPressEnter={handleSend}
                        ref={inputRef}
                        disabled={sendMessageApi.isPending}
                    />
                    <Button
                        className='!flex !items-center !justify-center'
                        type="primary"
                        icon={<img src={iconMessage} width={20} height={20} className='!object-contain' />}
                        shape='circle'
                        onClick={handleSend}
                        disabled={sendMessageApi.isPending}
                    />
                </Flex>
            </div>
        </Card>
    );
};

export default ChatBox;
