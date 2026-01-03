'use client';

import styles from './page.module.css';

const sections = [
    {
        title: "1. Introduction",
        content: "Welcome to School Messenger. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you use our application and tell you about your privacy rights and how the law protects you."
    },
    {
        title: "2. The Data We Collect",
        content: "We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:\n\n• Identity Data: Setup details including First Name, Last Name, and Profile Picture.\n• Contact Data: Email address and School/Group memberships.\n• Device Data: Device tokens for push notifications.\n• Usage Data: Information about how you use our app, such as message read receipts."
    },
    {
        title: "3. How We Use Your Data",
        content: "We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:\n\n• To register you as a new user.\n• To provide communication services between your school and you.\n• To manage our relationship with you including notifying you about changes.\n• To deliver relevant content and notifications to you."
    },
    {
        title: "4. Data Security",
        content: "We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. Access to your personal data is limited to those employees, agents, contractors and other third parties who have a business need to know."
    },
    {
        title: "5. Your Legal Rights",
        content: "Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent."
    },
    {
        title: "6. Contact Us",
        content: "If you have any questions about this privacy policy or our privacy practices, please contact your school administrator or our support team via the Technical Support feature in the app."
    }
];

export default function PrivacyPolicyPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Privacy Policy</h1>
                <p className={styles.lastUpdated}>Last updated: December 2025</p>
            </div>

            <div className={styles.content}>
                {sections.map((section, idx) => (
                    <div key={idx} className={styles.section}>
                        <h2 className={styles.sectionTitle}>{section.title}</h2>
                        <p className={styles.sectionText}>{section.content}</p>
                    </div>
                ))}

                <div className={styles.footer}>
                    <p className={styles.copyright}>© 2025 School Messenger. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
