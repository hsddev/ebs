const dotenv = require("dotenv");

dotenv.config({});

const getEbsData = require("./getEbsData");
const {
    updateAndCreateContacts,
    updateAndCreateApplications,
    updateAndCreateAssociations,
} = require("./hubspotApi");

(async () => {
    // App log
    console.log("Hubspot App script started");

    console.log("###############################");

    // Get all new contacts
    let contacts = await getEbsData();

    const contactToHubspot = contacts.map((obj) => {
        const { applications, ...rest } = obj;
        return rest;
    });

    // Contact count log
    console.log("Will process: %d contact(s)", contacts.length);

    // Add contacts list to hubspot
    await updateAndCreateContacts(contactToHubspot);

    console.log("###############################");

    await updateAndCreateApplications(contacts);

    console.log("###############################");

    await updateAndCreateAssociations(contacts);

    console.log("###############################");
})();
