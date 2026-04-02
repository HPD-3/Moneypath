import { useState } from "react";

export default function Email() {
    const sendEmail = async () => {
        const response = await fetch("/api/send-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "Hafidh",
                email: "hafidh@email.com",
                message: "Hello!",
            }),
        });

        const data = await response.json();
        console.log(data);
    };

    return (
        <button onClick={sendEmail}>
            Send Email
        </button>
    );
};