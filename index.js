const getEbsData = require("./getEbsData");
const addToHubspot = require("./addToHubspot");
const {
    findObjectIdOfUnitId,
    findContactIdInHubspot,
    associateApplicationToContact,
} = require("./findInHubspot");

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
    await addToHubspot(contactToHubspot);

    for (const contact of contacts) {
        const contactEmail = contact.email;

        try {
            // Step 1: Get contact ID from contact email
            const contactId = await findContactIdInHubspot(contactEmail);

            let n = 1;

            // Step 2: Loop through each application and check if it exists
            for (const application of contact.applications) {
                // Step 3: Get the object Id associated with the unit Id
                const objectId = await findObjectIdOfUnitId(application);

                // Step 4: Associate the application with the contact
                await associateApplicationToContact(contactId, objectId);
                console.log(
                    `Processing association for contact ${contactEmail} - id ${contactId} with applications ${n++}/${
                        contact.applications.length
                    }`
                );
            }
        } catch (error) {
            console.error(
                `Error processing contact with email ${contactEmail}: ${error.message}`
            );
        }
    }

    console.log("###############################");
})();
