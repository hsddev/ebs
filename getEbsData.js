// Dependencies
const sql = require("mssql");

// Database configuration
const pool = new sql.ConnectionPool({
    user: process.env.DB_USER,
    password: process.env.DB_USER_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
});

const getEbsData = async () => {
    try {
        console.log(process.env.DB_USER);
        // Connect to database
        const connect = await pool.connect();

        // Get data from contacts table
        const contacts = await connect
            .request()
            .query("SELECT * FROM Contacts");

        // Get data from applications table
        const applications = await pool
            .request()
            .query("SELECT * FROM Applications");

        // Create a mapping of contacts by email
        const contactsByEmail = await contacts.recordset.reduce(
            (map, contact) => {
                map[contact.PERSONAL_EMAIL] = {
                    student_reference: contact.STUDENT_REFERENCE,
                    firstname: contact.FIRST_NAME,
                    email: contact.PERSONAL_EMAIL,
                    lastname: contact.LAST_NAME,
                    date_of_birth: contact.DATE_OF_BIRTH,
                    marketing_consent: contact.MARKETING_CONSENT || undefined,
                    phone: contact.PHONE_NUMBER || undefined,
                    mobilephone: contact.MOBILE_PHONE_NUMBER || undefined,
                    zip: contact.POSTAL_CODE || undefined,
                    school_title: contact.SCHOOL_DESCRIPTION || undefined,
                    school_code: contact.SCHOOL_CODE,
                    // nationality: contact.NATIONALITY,
                    marketing_contact_methods:
                        contact.MARKETING_CONTACT_METHODS || undefined,
                    applications: [],
                };
                return map;
            },
            {}
        );

        // Associate applications with contacts by email
        await applications.recordset.forEach((application) => {
            const email = application.PERSONAL_EMAIL;
            if (contactsByEmail[email]) {
                contactsByEmail[email].applications.push({
                    unit_id: application.UNIT_ID,
                    course_occurrence: application.COURSE_OCCURRENCE,
                    course_code: application.COURSE_CODE,
                    website_advertised_title: application.WEBTITLE,
                    college_code: application.COLLEGE_CODE,
                    college_name: application.COLLEGE_FULLNAME,
                    org_level_1_code: application.ORG_L1_CODE,
                    org_level_1_name: application.ORG_L1_FULLNAME,
                    org_level_2_code: application.ORG_L2_CODE,
                    org_level_2_name: application.ORG_L2_FULLNAME,
                    org_level_3_code: application.ORG_L3_CODE,
                    org_level_3_name: application.ORG_L3_FULLNAME,
                    application_created_date: application.CREATED_DATE,
                    study_location_code:
                        application.STUDY_LOCATION_CODE || undefined,
                    study_location_description:
                        application.STUDY_LOCATION_DESCRIPTION || undefined,
                    study_location_postcode:
                        application.STUDY_LOCATION_POSTCODE || undefined,
                    qualification_type:
                        application.QUALIFICATION_TYPE || undefined,
                    stage: application.STAGE,
                });
            }
        });

        // Convert the map to an array
        const changedUsers = Object.values(contactsByEmail);

        return changedUsers;
    } catch (err) {
        console.log(err);
    }
};

module.exports = getEbsData;
