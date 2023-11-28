// Dependencies
const sql = require("mssql");

// Database configuration
const pool = new sql.ConnectionPool({
    user: "hubspot",
    password: "v6HiIUykazx4LxK55i0d",
    server: "51.104.3.79",
    database: "ebsintegration_dmz",
    port: 1433,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
});

const getEbsData = async () => {
    try {
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

        // Changed contacts format
        const changedUsers = await contacts.recordset.map((contact) => {
            return {
                student_reference: contact.STUDENT_REFERENCE,
                firstname: contact.FIRST_NAME,
                email: contact.PERSONAL_EMAIL,
                lastname: contact.LAST_NAME,
                date_of_birth: contact.DATE_OF_BIRTH,
                marketing_consent: contact.MARKETING_CONSENT,
                phone: contact.MOBILE_PHONE_NUMBER,
                zip: contact.POSTAL_CODE,
                school_title: contact.SCHOOL_DESCRIPTION,
                school_code: contact.SCHOOL_CODE,
                marketing_contact_methods: contact.MARKETING_CONTACT_METHODS,
            };
        });
        return changedUsers;
    } catch (err) {
        console.log(err);
    }
};

module.exports = getEbsData;
