import { useMutation } from "@tanstack/react-query";
import axiosBase from "../configs/axiosBase";

const sendMessageChat = async (payload) => {
    const response = await axiosBase.post("http://localhost:5006/webhooks/rest/webhook", payload);
    return response.data
}

const useSendMessageChatMutation = () => {
    return useMutation({
        mutationFn: sendMessageChat
    })
}

export {useSendMessageChatMutation}