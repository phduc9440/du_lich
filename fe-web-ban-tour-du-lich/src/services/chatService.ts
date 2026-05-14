import { useMutation } from "@tanstack/react-query";
import axiosBase from "../configs/axiosBase";

const sendMessageChat = async (payload) => {
    const rasaUrl = import.meta.env.VITE_RASA_URL || "http://localhost:5005";
    const response = await axiosBase.post(`${rasaUrl}/webhooks/rest/webhook`, payload);
    return response.data
}

const useSendMessageChatMutation = () => {
    return useMutation({
        mutationFn: sendMessageChat
    })
}

export {useSendMessageChatMutation}