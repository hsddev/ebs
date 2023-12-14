const dotenv = require("dotenv");
const getEbsData = require("./getEbsData");
const {
    addContactsToHubspot,
    findObjectIdOfUnitId,
    findContactIdInHubspot,
    associateApplicationToContact,
} = require("./hubspotApi");

// Middleware
dotenv.config({});

(async () => {
    // App log
    console.log("Hubspot App script started");

    console.log("###############################");

    // Get all new contacts
    const contacts = await getEbsData();

    const contactToHubspot = contacts.map((obj) => {
        const { applications, ...rest } = obj;
        return rest;
    });

    // Contact count log
    console.log("Will process: %d contact(s)", contactToHubspot.length);

    // Add contacts list to hubspot
    await addContactsToHubspot(contactToHubspot);

    for (let contact of contacts) {
        let contactEmail = contact.email;

        try {
            // Step 1: Get contact ID from contact email
            const contactId = await findContactIdInHubspot(contactEmail);

            // Step 2: Loop through each application and check if it exists
            for (const application of contact.applications) {
                // Step 3: Get the object Id associated with the unit Id
                const objectId = await findObjectIdOfUnitId(application);

                // Step 4: Associate the application with the contact
                await associateApplicationToContact(
                    contactEmail,
                    contactId,
                    objectId
                );
            }
        } catch (error) {
            console.error(
                `Error processing contact with email ${contactEmail}: ${error.message}`
            );
        }

        console.log(
            `Successfully associated contact ${contactEmail} with ${contact.applications.length} applications.`
        );
    }

    console.log("###############################");
})();
