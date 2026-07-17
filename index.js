const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle
} = require("discord.js");

const { clientId, guildId, token } = require('./config.json');
const TOKEN = token;
const CLIENT_ID = clientId;
const GUILD_ID = guildId;

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const fs = require("fs");
const dataFilePath = ".\\data.json";


function getChannelIdFromData() {
    if (fs.existsSync(dataFilePath)) {
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        return data.hrSignupChannelId;
    }
}

function updateChannelIdInData(channelId) {
    let data = {};
    if (fs.existsSync(dataFilePath)) {
        data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    }
    data.hrSignupChannelId = channelId;
    fs.writeFileSync(dataFilePath, JSON.stringify(data));
}

function getMessageIdFromData() {
    if (fs.existsSync(dataFilePath)) {
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        return data.hrSignupMessageId;
    }
}

function updateMessageIdInData(messageId) {
    let data = {};
    if (fs.existsSync(dataFilePath)) {
        data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    }
    data.hrSignupMessageId = messageId;
    fs.writeFileSync(dataFilePath, JSON.stringify(data));
}

function updateSignupMessage() {
    const hrSignupMessage = generateHrSignupMessage();
    const channelId = getChannelIdFromData();
    const messageId = getMessageIdFromData();

    if (channelId && messageId) {
        const channel = client.channels.cache.get(channelId);
        if (channel) {
            channel.messages.fetch(messageId)
                .then(message => {
                    message.edit(hrSignupMessage);
                })
                .catch(console.error);
        }
    }
}



function addSignup(day, player) {
    if (fs.existsSync(dataFilePath)) {
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

        // check if player already signed up for any day
        for (const d in data.days) {
            if (data.days[d].includes(player)) {
                // remove player from that day
                data.days[d] = data.days[d].filter(p => p !== player);
            }
        }

        if (data.days[day]) {
            data.days[day].push(player);
        } else {
            data.days[day] = [player];
        }
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4));
    }
}

function removeSignup(player) {
    if (fs.existsSync(dataFilePath)) {
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        for (const d in data.days) {
            data.days[d] = data.days[d].filter(p => p !== player);
        }
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4));
        }
}

async function postSignupMessage(channel) {
    const hrSignupMessage = generateHrSignupMessage();

    // Generate buttons for each day
    const mondayButton = new ButtonBuilder()
        .setCustomId('signup_monday')
        .setLabel('Sign up for Monday')
        .setStyle(ButtonStyle.Primary);

    const wednesdayButton = new ButtonBuilder()
        .setCustomId('signup_wednesday')
        .setLabel('Sign up for Wednesday')
        .setStyle(ButtonStyle.Primary);

    const fridayButton = new ButtonBuilder()
        .setCustomId('signup_friday')
        .setLabel('Sign up for Friday')
        .setStyle(ButtonStyle.Primary);

        const removeButton = new ButtonBuilder()
        .setCustomId('signup_remove')
        .setLabel('Remove Signup')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder()
        .addComponents(mondayButton, wednesdayButton, fridayButton, removeButton);

    return await channel.send({ content: hrSignupMessage, components: [row] });
}

function generateSignupLink() {
    return "https://discord.com/channels/" + GUILD_ID + "/" + getChannelIdFromData() + "/" + getMessageIdFromData();
}

function generateHrSignupMessage() {
    let stringPlayersMonday = "";
    let stringPlayersWednesday = "";
    let stringPlayersFriday = "";
    const guild = client.guilds.cache.get(GUILD_ID);

    // Return a formatted string of players for each day
    if (fs.existsSync(dataFilePath)) {
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        // Get user display names from the user IDs stored in the data in the guild.
        if (data.days.monday) {
            stringPlayersMonday = data.days.monday.map(id => guild.members.cache.get(id)?.displayName || id).join(', ') || "No signups yet";
        }
        if (data.days.wednesday) {
            stringPlayersWednesday = data.days.wednesday.map(id => guild.members.cache.get(id)?.displayName || id).join(', ') || "No signups yet";
        }
        if (data.days.friday) {
            stringPlayersFriday = data.days.friday.map(id => guild.members.cache.get(id)?.displayName || id).join(', ') || "No signups yet";
        }
    }


return "<:Embers:1527406753657131099> **Hero Realm Sign-Up** <:Embers:1527406753657131099>\n\n"+
           "**Monday** <t:1775755800:t> 🔥\n*" +
            stringPlayersMonday + "*\n\n" +
            "**Wednesday** <t:1775755800:t> 🔥 \n*" +
            stringPlayersWednesday + "*\n\n" +
            "**Friday** <t:1775763000:t> 🔥\n*" +
            stringPlayersFriday + "*\n\n\n" +
            "Sign up for a day by clicking the buttons **below!**\n"+
            "If you can’t make it on a day you’ve signed up for, please let one of the council know."; //\u200b\n\u200b";
}

function resetHRSignups() {
    const channelId = getChannelIdFromData();
    const messageId = getMessageIdFromData();
    const data = {
        days: {
            monday: [],
            wednesday: [],
            friday: []
        },
        hrSignupChannelId: channelId,
        hrSignupMessageId: messageId
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 4));

    updateSignupMessage();
}

////////////// Commands

const commands = [];

// /signup
commands.push(
    new SlashCommandBuilder()
    .setName("signup")
    .setDescription("Sign up for the Hero Realm")
    .addStringOption(option =>
        option
            .setName("day")
            .setDescription("Select a  day you want to run")
            .setRequired(true)
            .addChoices(
                { name: "Monday", value: "monday" },
                { name: "Wednesday", value: "wednesday" },
                { name: "Friday", value: "friday" },
                { name: "Remove Signup", value: "remove" }
            )
    )
    .toJSON()
);

// /createsignups
commands.push(
    new SlashCommandBuilder()
    .setName("createsignups")
    .setDescription("Create a new Hero Realm")
    .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild
    )
    .toJSON()
)

// /resetsignups
commands.push(
    new SlashCommandBuilder()
    .setName("resetsignups")
    .setDescription("Reset Hero Realm signups")
    .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild
    )
    .toJSON()
)

// /showsignups
commands.push(
    new SlashCommandBuilder()
    .setName("showsignups")
    .setDescription("Show the current Hero Realm signups")
    .setDefaultMemberPermissions(
        PermissionFlagsBits.ManageGuild
    )
    .toJSON()
)

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        console.log("Registering slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log("Slash commands registered.");
    } catch (error) {
        console.error(error);
    }
})();

client.once("clientReady", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

const { EmbedBuilder } = require("discord.js");

//////////// Command interactions
client.on("interactionCreate", async (interaction) => 
{
    if (!interaction.isChatInputCommand()) return;

    // /signup
    if (interaction.commandName === "signup") {
        if (interaction.options.getString("day") === "remove") {
            removeSignup(interaction.user.displayName);
            await interaction.reply({ content: "You have been removed from the signups.", ephemeral: true });
            updateSignupMessage();
            return;
        }
        const day = interaction.options.getString("day");
        await interaction.reply({ content: `You signed up for ${day}!`, ephemeral: true });
        addSignup(day, interaction.user.id);
        updateSignupMessage();
    }


    // /createsignups
     if (interaction.commandName === "createsignups") {
        const message = await postSignupMessage(interaction.channel);

        // Save the message ID to data.json
        updateMessageIdInData(message.id);
        updateChannelIdInData(interaction.channel.id);
    }

    // /resetsignups
    if (interaction.commandName === "resetsignups") {
        resetHRSignups();
        await interaction.reply({ content: "Hero Realm signups have been reset.", ephemeral: true });
    }

    // /showsignups
    if (interaction.commandName === "showsignups") {
        const hrSignupLink = generateSignupLink();
        await interaction.reply(hrSignupLink);
    }
});


//////////// Button interactions
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const day = interaction.customId.split("_")[1];

    if (day) {
        if (day === "remove") {
            removeSignup(interaction.user.displayName);
            await interaction.reply({ content: "You have been removed from the signups.", ephemeral: true });
            updateSignupMessage();
        } else {
            addSignup(day, interaction.user.displayName);
            await interaction.reply({ content: `You signed up for ${day}!`, ephemeral: true });
            updateSignupMessage();
        }
    }
});


client.login(TOKEN);