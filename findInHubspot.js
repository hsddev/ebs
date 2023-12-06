// Dependencies
const axios = require("axios");

// Get contact Id from contact email
const findContactIdInHubspot = async (contactEmail) => {
    try {
        const response = await axios({
            method: "get",
            url: `https://api.hubapi.com/contacts/v1/contact/email/${contactEmail}/profile`,
            headers: {
                Authorization:
                    "Bearer pat-eu1-28ce7e46-5c39-45b2-b93a-405138c9c9fc",
                "Content-Type": "application/json",
            },
        });
        return response.data.vid;
    } catch (err) {
        throw new Error(err);
    }
};

// Find Object Id associate to the unit Id
const findObjectIdOfUnitId = async (application) => {
    try {
        const res = await axios({
            url: "https://api.hubapi.com/crm/v3/objects/applications?properties=unit_id",
            method: "get",
            headers: {
                Authorization:
                    "Bearer pat-eu1-28ce7e46-5c39-45b2-b93a-405138c9c9fc",
                "Content-Type": "application/json",
            },
        });

        // Check if the unit Id exists in the response
        const applicationExists = res.data.results.some(
            (app) => app.properties.unit_id == application.unit_id
        );

        if (!applicationExists) {
            const createdApplication = await createApplication(application);
            return createdApplication.data.id;
        } else {
            return res.data.results
                .filter(
                    (item) => item.properties.unit_id == application.unit_id
                )
                .map((item) => item.id);
        }
    } catch (err) {
        console.log(err);
        return false;
    }
};

/*
{
                    website_advertised_title: "Spanish",
                    hs_pipeline: 246305223,
                    hs_pipeline_stage: 411851999,
}
*/
// Create an application if it doesn't already exist
const createApplication = async (properties) => {
    try {
        const res = await axios({
            method: "post",
            url: "https://api.hubspot.com/crm/v3/objects/2-120350606",
            headers: {
                Authorization:
                    "Bearer pat-eu1-28ce7e46-5c39-45b2-b93a-405138c9c9fc",
                "Content-Type": "application/json",
            },
            data: {
                properties: properties,
            },
        });
        return res;
    } catch (err) {
        console.log(err);
    }
};

// Associate the object with contact
const associateApplicationToContact = async (contactId, applicationId) => {
    try {
        const res = await axios({
            method: "put",
            url: `https://api.hubapi.com/crm/v4/objects/contact/${contactId}/associations/applications/${applicationId}`,
            headers: {
                Authorization:
                    "Bearer pat-eu1-28ce7e46-5c39-45b2-b93a-405138c9c9fc",
                "Content-Type": "application/json",
            },
            data: JSON.stringify([
                {
                    associationCategory: "USER_DEFINED",
                    associationTypeId: 54,
                },
            ]),
        });
        return res;
    } catch (err) {
        console.log(err);
    }
};

// Export module
module.exports = {
    findContactIdInHubspot,
    findObjectIdOfUnitId,
    createApplication,
    associateApplicationToContact,
};
