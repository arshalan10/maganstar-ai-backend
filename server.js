const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/call", async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            service,
            message
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                error: "Name, email and phone number are required."
            });
        }

        console.log("=================================");
        console.log("New website enquiry:");
        console.log({
            name,
            email,
            phone,
            service,
            message
        });
        console.log("=================================");

        // Start outbound call through ElevenLabs + Exotel
        const response = await fetch(
            "https://api.elevenlabs.io/v1/convai/exotel/outbound-call",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": process.env.ELEVENLABS_API_KEY
                },

                body: JSON.stringify({
                    agent_id: process.env.ELEVENLABS_AGENT_ID,

                    agent_phone_number_id:
                        process.env.ELEVENLABS_PHONE_NUMBER_ID,

                    to_number: phone,

                    conversation_initiation_client_data: {
                        dynamic_variables: {
                            customer_name: name,
                            customer_email: email,
                            customer_phone: phone,
                            service: service || "",
                            customer_message: message || ""
                        }
                    }
                })
            }
        );

        const result = await response.json();

        console.log("ElevenLabs response:");
        console.log(result);

        // ElevenLabs returned an error
        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error:
                    result.detail ||
                    result.message ||
                    "ElevenLabs could not start the call."
            });
        }

        // Successful call request
        return res.json({
            success: true,
            message: "AI assistant call started.",
            conversation_id: result.conversation_id || null,
            callSid: result.callSid || null
        });

    } catch (error) {
        console.error("Server error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            error: "Unable to start the AI call."
        });
    }
});

// Health check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "MaganStar AI backend is running."
    });
});

// cPanel/Passenger provides the PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log("MaganStar AI backend is running");
    console.log(`Port: ${PORT}`);
    console.log("=================================");
});