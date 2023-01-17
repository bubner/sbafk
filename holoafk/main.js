/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

/**
 * holoafk ChatTriggers module
 * @author Lucas Bubner, 2023
 */

import Settings from "./config";
import request from "requestv2/index";

// Register /holo to the settings configuration command
register("command", () => {
    Settings.openGUI();
}).setName("holo");

/**
 * Utility function to send a message through the plugin to the user's ingame chat
 * @param {string} message Message to send to the user, [holoafk] prefix will be added automatically.
 */
function sendMsg(message) {
    setTimeout(() => {
        ChatLib.chat(`&4[&choloafk&4]&c ${message}`);
    }, 100);
}

/**
 * Sends a message to the Discord webhook, used for chat scan triggers and server disconnect notifications.
 * @param {string} msg Message to be relayed to the Discord webhook.
 */
function sendToDiscord(msg) {
    if (!Settings.webhookurl.includes("discord.com/api/webhooks/"))
        sendMsg("Invalid Discord webhook URL provided!");

    let internalMsg = `Sending Discord notification from triggering message: "${msg}"`;
    if (!Settings.discordid)
        internalMsg += ", but no Discord ID to ping was specified.";
    sendMsg(internalMsg);

    const pingmsg = Settings.discordid ? Settings.discordid : "";
    const fullmsg = "" + `\n<t:${Math.floor(Date.now() / 1000)}:R>`;

    request({
        url: Settings.webhookurl,
        method: "POST",
        headers: {
            "Content-type": "application/json",
            "User-Agent": "Mozilla/5.0",
        },
        body: {
            username: "holoafk notifier",
            avatar_url: "https://cdn.discordapp.com/attachments/792907086555643904/1061517437708816444/holov2simple.png",
            content: pingmsg,
            embeds: [
                {
                    title: "holoafk",
                    color: 0xed1c24,
                    description: fullmsg,
                    footer: {
                        text: "Created by holo911, mitigating Australian internet one step a time.",
                    },
                    fields: [],
                },
            ],
        },
    });
}

/**
 * Primary listener for chat scan triggers. Listens for specific server disconnect notifications while on the Private Island.
 */
register("chat", (e) => {
    // Don't do anything if the module is not activated in the settings, or
    // if the Discord webhook has not been set up yet.
    if (!Settings.toggle || !Settings.webhookurl) return;

    const flaggedMsgs = [
        "evacuating",
        "lobby",
        "afk",
        "disconnect",
        "kick",
        "exception",
        "limbo",
    ];

    const exceptedMsgs = ["tipped", "spooky", "joined the lobby"];

    // Get the latest message from the chat
    const message = ChatLib.removeFormatting(
        ChatLib.getChatMessage(e, true)
    ).toLowerCase();

    // Check if the message contains any flagged words from flaggedMsgs while also making
    // sure that the message does not contain any excepted words from exceptedMsgs
    if (message.includes(flaggedMsgs) && !message.includes(exceptedMsgs)) {
        sendToDiscord(message);
    }
});
