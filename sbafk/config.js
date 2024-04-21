import { @Vigilant, @SwitchProperty, @TextProperty } from "../Vigilance/index.js";

@Vigilant("sbafk", "§4§lsbafk", {
    getCategoryComparator: () => (a, b) => {
        const categories = ["Global", "Automation", "Discord"];
        return categories.indexOf(a.name) - categories.indexOf(b.name);
    }
})

class Settings {
    constructor() {
        this.initialize(this);
        this.setCategoryDescription("Global", "&4sbafk &7auto notifier");
        this.setCategoryDescription("Automation", "&4sbafk &7auto notifier");
        this.setCategoryDescription("Discord", "&4sbafk &7auto notifier");
    }

    @SwitchProperty({
        name: "Toggle",
        description: "Toggle all module operations from activating.",
        category: "Global",
    })
    toggle = true;

    @TextProperty({
        name: "Discord Webhook URL",
        description: "(Required) Insert Discord Webhook URL here.",
        category: "Discord",
        placeholder: 'Paste webhook URL here',
    })
    webhookurl = "";

    @TextProperty({
        name: "Discord ID to ping",
        description: "Discord ID of the person to ping on a notification trigger. Supports @everyone and @here as well. Leave blank for no ping.",
        category: "Discord",
        placeholder: 'Paste Discord user id here',
    })
    discordid = "";

    @TextProperty({
        name: "Bot Identifier",
        description: "Will be appended to the webhook name to differentiate between accounts. Example: sbafk for <your bot identifier>",
        category: "Discord",
        placeholder: 'sbafk for <your bot identifier>',
    })
    botidentifier = "";

    @TextProperty({
        name: "Max Tries",
        description: "Maximum number of tries to attempt to reconnect to the SkyBlock island",
        category: "Automation",
        placeholder: 'A number of tries to attempt. Defaults to 2.',
    })
    maxtries = "";
}

export default new Settings;
