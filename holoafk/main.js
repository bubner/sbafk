/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

/**
 * holoafk ChatTriggers module
 * @author Lucas Bubner, 2023
 */

import Settings from "./config.js";
import request from "requestv2/index";

// Register /holo to the settings configuration command
register("command", () => {
    Settings.openGUI();
}).setName("holo");

/**
 * Utility function to send a message through the plugin to the user's ingame chat.
 * @param {string} message Message to send to the user, [holoafk] prefix will be added automatically.
 */
function sendMsg(message) {
    setTimeout(() => {
        ChatLib.chat(`&4[&choloafk&4]&7 ${message}`);
    }, 100);
}

/**
 * Internal function to check if settings are valid before sending a request to the Discord webhook.
 */
function checkSettings(msg) {
    if (!Settings.webhookurl.includes("discord.com/api/webhooks/")) {
        sendMsg("Invalid Discord webhook URL provided!");
        return false;
    }

    let internalMsg = `Sending Discord notification from triggering message: "${msg}"`;
    if (!Settings.discordid)
        internalMsg += ", but no Discord ID to ping was specified.";
    sendMsg(internalMsg);
    return true;
}

/**
 * Internal function to check if a user is in SkyBlock or not.
 */
function isInSkyBlock() {
    return ChatLib.removeFormatting(Scoreboard.getTitle()).includes("SKYBLOCK");
}

/**
 * Sends a pinging message to the Discord webhook, used for server disconnect and irrecoverable states.
 * @param {string} msg Message to be relayed to the Discord webhook.
 */
function sendToDiscordHigh(msg, content) {
    if (!checkSettings(msg)) return;

    let pingmsg;
    if (Settings.discordid == "@everyone" || Settings.discordid == "@here") {
        pingmsg = Settings.discordid;
    } else {
        pingmsg = Settings.discordid ? `<@${Settings.discordid}>` : "";
    }

    const fullmsg = content + "\n\nTriggered by message:\n" + msg + `\n<t:${Math.floor(Date.now() / 1000)}:R>`;

    request({
        url: Settings.webhookurl,
        method: "POST",
        headers: {
            "Content-type": "application/json",
            "User-Agent": "Mozilla/5.0",
        },
        body: {
            username: Settings.botidentifier ? `holoafk notifier for ${Settings.botidentifier}` : "holoafk notifier",
            avatar_url: "https://cdn.discordapp.com/attachments/792907086555643904/1061517437708816444/holov2simple.png",
            content: pingmsg,
            embeds: [
                {
                    title: "HIGH PRIORITY MESSAGE",
                    color: 0xed1c24,
                    description: fullmsg,
                    footer: {
                        text: "Created by holo911, mitigating Australian internet one step a time.",
                    },
                    fields: [],
                },
            ],
        },
    }).catch((err) => {
        setTimeout(() => {
            // Catch any errors that might happen with the webhook, and retry the function again,
            // but after a 10 second delay.
            sendMsg("An error occurred while trying to send a high priority message through the Discord webhook. Retrying in 10 seconds...", err);
            sendToDiscordHigh(msg, content);
        }, 10000);
    });
}

/**
 * Sends a standard message to the Discord webhook, used for informational purposes and recoverable states.
 * @param {string} msg Message to be relayed to the Discord webhook.
 */
function sendToDiscordLow(msg, content) {
    if (!checkSettings(msg)) return;

    const fullmsg = content + "\n\nTriggered by message:\n" + msg + `\n<t:${Math.floor(Date.now() / 1000)}:R>`;

    request({
        url: Settings.webhookurl,
        method: "POST",
        headers: {
            "Content-type": "application/json",
            "User-Agent": "Mozilla/5.0",
        },
        body: {
            username: Settings.botidentifier ? `holoafk notifier for ${Settings.botidentifier}` : "holoafk notifier",
            avatar_url: "https://cdn.discordapp.com/attachments/792907086555643904/1061517437708816444/holov2simple.png",
            content: "",
            embeds: [
                {
                    title: "Low Priority Message",
                    color: 0x00b020,
                    description: fullmsg,
                    footer: {
                        text: "Created by holo911, mitigating Australian internet one step a time.",
                    },
                    fields: [],
                },
            ],
        },
    }).catch((err) => {
        setTimeout(() => {
            // Catch any errors that might happen with the webhook, and retry the function again.
            // Must wait a minimum of 20 seconds before retrying.
            sendMsg("An error occurred while trying to send a low priority message through the Discord webhook. Retrying in 20 seconds...", err);
            sendToDiscordLow(msg, content);
        }, 20000);
    });
}

/**
 * Attempt to recover the connection to the SkyBlock island from the Prototype or Main Lobby.
 */
function attemptLobbyRecovery(m) {
    let maxTries = Settings.maxtries ? parseInt(Settings.maxtries) : 2;
    let currentTry = 0;
    
    setTimeout(() => {
        function tryJoinSkyBlock(callback) {
            if (!isInSkyBlock() && currentTry < maxTries) {
                // Send command to join SkyBlock
                setTimeout(() => {
                    ChatLib.say("/play sb");
                }, 200);
                currentTry++;
        
                // Wait 10 seconds before trying again
                setTimeout(() => tryJoinSkyBlock(callback), 10000);
            } else {
                callback();
            }
        }
        tryJoinSkyBlock(() => {
            if (currentTry === maxTries && !isInSkyBlock()) {
                // Max automatic attempts were made. Alert user that recovery was unsuccessful.
                sendToDiscordHigh(m, "User was kicked from the island, and automatic recovery was unsuccessful. Please check your account.");
                return;
            }

            // Notify user recovery was successful and no further action is required
            if (isInSkyBlock())
                sendToDiscordLow(m, "User was kicked from the island, but automatic recovery was successful. No actions required.");
        });
    }, 2000);
}

/**
 * Attempt to recover the connection to the SkyBlock island from the SkyBlock Lobby.
 */
function attemptHubRecovery(m) {
    let connected = false;
    let i = 0;

    // Make a listener for world loading to detect if we have connected back to the island
    register("worldLoad", () => {
        connected = true;
    });

    function tryRecover() {
        if (i < (Settings.maxtries ? parseInt(Settings.maxtries) : 2) && !connected) {
            // Rejoin island from the hub
            ChatLib.say("/is");
            i++;

            // Wait 5 seconds before trying again
            setTimeout(tryRecover, 5000);
        } else {
            if (!connected) {
                // If we're still connected to the hub, alert through Discord that automatic recovery was unsuccessful
                sendToDiscordHigh(m, "User was spawned into the hub, and automatic recovery was unsuccessful. Please check your account.");
                return;
            }

            // Connection established to the Private Island again.
            sendToDiscordLow(m, "User was spawned into the hub, but automatic recovery was successful. No actions required.");
        }
    }
    // Wait 2 seconds before trying recovery
    setTimeout(tryRecover, 2000);
}


/**
 * Attempt to recover the connection to the SkyBlock island from Limbo.
 */
function attemptLimboRecovery(m) {
    // Runs the same as an attempt to recover from a lobby, however, this command needs to go to the lobby first,
    // as running /play is not allowed from Limbo.
    setTimeout(() => {
        attemptLobbyRecovery(m);
    }, 2000);

    setTimeout(() => {
        ChatLib.say("/l");
    }, 400);
}

let alreadycalled = false;

/**
 * Secondary listener to recover the worldUnload listener and allow it to fire again
 */
register("worldLoad", () => {
    alreadycalled = false;
});

/**
 * Primary listener for server/world disconnects, where the plugin will not be able to reconnect the user.
 */
register("worldUnload", () => {
    // Don't do anything if the module is not active, or if the call has already been sent
    if (!Settings.toggle || alreadycalled) return;

    // Get the current IP of the user. If it is blank, we are not connected to a server,
    // but if it is present, we have simply switched servers.
    alreadycalled = true;
    setTimeout(() => {
        if (Server.getIP() == "")
            sendToDiscordHigh("<account disconnect detection>", "User has lost connection to the server and cannot be recovered automatically. Please check your account.");
    }, 2000);
});

/**
 * Primary listener for chat scan triggers. Listens for specific server disconnect notifications while on the Private Island.
 */
register("chat", (e) => {
    // Don't do anything if the module is not activated in the settings, or
    // if the Discord webhook has not been set up yet.
    if (!Settings.toggle || !Settings.webhookurl) return;

    const recoveryFunctions = [
        attemptHubRecovery,
        attemptHubRecovery,
        attemptLobbyRecovery,
        attemptLobbyRecovery,
        attemptLobbyRecovery,
        attemptLimboRecovery,
        attemptLimboRecovery,
    ];

    const flaggedMsgs = [
        "evacuating to hub",
        "you are being transferred",
        "an exception occurred in your connection",
        "a disconnect occurred in your connection",
        "a kick occurred in your connection",
        "you are afk",
        "you were spawned in limbo",
    ];

    // Get the latest message from the chat
    const message = ChatLib.removeFormatting(
        ChatLib.getChatMessage(e, true)
    );

    // Check if the message contains any flagged phrases from flaggedMsgs, then attempt to run an automatic recovery sequence
    for (let i = 0; i < flaggedMsgs.length; i++) {
        if (message.toLowerCase().includes(flaggedMsgs[i])) {
            recoveryFunctions[i](message);
            break;
        }
    }
});
