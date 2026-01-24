// FAQ Content for SEO/AEO Optimization
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'products' | 'company' | 'ordering' | 'technical' | 'certifications';
}

export const faqCategories = [
  { id: 'products', name: 'Products', icon: 'package' },
  { id: 'company', name: 'Company', icon: 'building' },
  { id: 'ordering', name: 'Ordering & Distribution', icon: 'truck' },
  { id: 'technical', name: 'Technical Support', icon: 'settings' },
  { id: 'certifications', name: 'Certifications', icon: 'shield' },
] as const;

export const faqItems: FAQItem[] = [
  // Products
  {
    id: 'what-is-torr-rf',
    question: 'What is TORR RF and what are its main applications?',
    answer: 'TORR RF is our flagship FDA 510(k) cleared medical device that uses innovative Multi-Wave Radiofrequency technology to deliver thermal energy into the dermal and subcutaneous layers. It is primarily used for non-invasive aesthetic treatments including skin tightening, wrinkle reduction, and body contouring. The device features patented segmented electrode designs for precise energy delivery.',
    category: 'products',
  },
  {
    id: 'torr-rf-fda-cleared',
    question: 'Is TORR RF FDA cleared?',
    answer: 'Yes, TORR RF has received FDA 510(k) clearance (K212561) in 2022. This clearance confirms that the device meets the safety and effectiveness standards required by the U.S. Food and Drug Administration for marketing in the United States.',
    category: 'products',
  },
  {
    id: 'ulblanc-features',
    question: 'What makes ULBLANC different from other ultrasound devices?',
    answer: 'ULBLANC is a comprehensive skincare workstation that combines dual-frequency ultrasound technology with acoustic cavitation for transdermal drug delivery (i-Booster technology). This unique combination allows for both skin tightening effects and enhanced absorption of skincare products, making it a versatile solution for aesthetic clinics.',
    category: 'products',
  },
  {
    id: 'newchae-shot-home-use',
    question: 'Can NEWCHAE SHOT be used at home?',
    answer: 'Yes, NEWCHAE SHOT is specifically designed as a 3-in-1 personal beauty device for home care use. It integrates professional-grade medical technologies into a compact, user-friendly form factor with multi-channel energy delivery, allowing consumers to achieve professional-level skincare results at home.',
    category: 'products',
  },
  {
    id: 'lumino-wave-availability',
    question: 'When will LUMINO WAVE be available?',
    answer: 'LUMINO WAVE is scheduled for launch in the second half of 2026. This next-generation device features our innovative Convergence Therapy technology, combining Ultrasound and Laser to maximize skin penetration. Contact our sales team to be notified when it becomes available.',
    category: 'products',
  },
  
  // Company
  {
    id: 'company-history',
    question: 'When was BRITZMEDI established?',
    answer: 'BRITZMEDI Co., Ltd. was established on October 23, 2017, in South Korea. We started as a Company-Affiliated Research Institute and have grown into a global medical device manufacturer with FDA clearance, ISO 13485 certification, and Venture Enterprise designation.',
    category: 'company',
  },
  {
    id: 'company-location',
    question: 'Where is BRITZMEDI located?',
    answer: 'Our headquarters and manufacturing facility are located at 1211, 388, Dunchon-daero, Jungwon-gu, Seongnam-si, Gyeonggi-do, Republic of Korea (Postal Code: 13403). We operate a GMP-certified manufacturing facility with integrated R&D capabilities.',
    category: 'company',
  },
  {
    id: 'rd-capabilities',
    question: 'Does BRITZMEDI have its own R&D capabilities?',
    answer: 'Yes, BRITZMEDI operates a Company-Affiliated Research Institute with dedicated R&D personnel. We have registered 11+ patents (10 domestic, 1 international) and 5 trademarks. Our R&D type Venture Enterprise designation confirms our commitment to innovation in aesthetic medical technology.',
    category: 'company',
  },
  
  // Ordering & Distribution
  {
    id: 'become-distributor',
    question: 'How can I become a BRITZMEDI distributor?',
    answer: 'We welcome partnership inquiries from qualified distributors worldwide. To become a distributor, please contact our sales team through the Contact page with information about your company, territory of interest, and relevant experience in medical device distribution. We will review your application and arrange a consultation.',
    category: 'ordering',
  },
  {
    id: 'minimum-order',
    question: 'What are the minimum order quantities?',
    answer: 'Minimum order quantities vary by product and market. Please contact our sales team for specific MOQ information based on your territory and requirements. We offer flexible arrangements for qualified distributors and can discuss sample units for evaluation purposes.',
    category: 'ordering',
  },
  {
    id: 'shipping-international',
    question: 'Do you ship internationally?',
    answer: 'Yes, we ship to distributors and partners worldwide. Our products are manufactured in our GMP-certified facility in Korea and shipped according to international medical device shipping standards. Shipping terms and logistics will be discussed during partnership negotiations.',
    category: 'ordering',
  },
  {
    id: 'oem-odm-services',
    question: 'Do you offer OEM/ODM services?',
    answer: 'Yes, BRITZMEDI is an FDA-registered contract manufacturer (Owner Operator Number: 10088936) offering comprehensive OEM/ODM services. We provide end-to-end development services from design to manufacturing, leveraging our GMP-certified facility and experienced R&D team. Contact us to discuss your specific requirements.',
    category: 'ordering',
  },
  
  // Technical
  {
    id: 'training-provided',
    question: 'Do you provide training for your devices?',
    answer: 'Yes, we provide comprehensive training programs for all our medical devices. Training includes device operation, treatment protocols, safety procedures, and maintenance. Training can be conducted on-site, at our facility in Korea, or through our digital training platform. Contact your local distributor or our support team for training arrangements.',
    category: 'technical',
  },
  {
    id: 'warranty-policy',
    question: 'What is your warranty policy?',
    answer: 'BRITZMEDI products come with a standard manufacturer warranty. Warranty terms and coverage vary by product and region. Our warranty covers manufacturing defects and includes technical support. Extended warranty options are available. Please refer to your purchase documentation or contact our support team for specific warranty information.',
    category: 'technical',
  },
  {
    id: 'technical-support',
    question: 'How can I get technical support?',
    answer: 'Technical support is available through multiple channels: 1) Contact your local authorized distributor, 2) Email our support team at contact@britzmedi.co.kr, 3) Call us at +82-70-4348-7244 during business hours (9:00 AM - 6:00 PM KST, Monday-Friday). We aim to respond to all inquiries within 1-2 business days.',
    category: 'technical',
  },
  
  // Certifications
  {
    id: 'iso-certification',
    question: 'Is BRITZMEDI ISO certified?',
    answer: 'Yes, BRITZMEDI is ISO 13485:2016 certified, which is the international standard for medical device quality management systems. This certification demonstrates our commitment to consistent quality and regulatory compliance in the design, development, and manufacturing of medical devices.',
    category: 'certifications',
  },
  {
    id: 'gmp-certified',
    question: 'Is your manufacturing facility GMP certified?',
    answer: 'Yes, our manufacturing facility is GMP (Good Manufacturing Practice) certified by the Korean Ministry of Food and Drug Safety (MFDS). We obtained this certification in 2021, and it ensures that our products are consistently produced and controlled according to quality standards.',
    category: 'certifications',
  },
  {
    id: 'regulatory-approvals',
    question: 'What regulatory approvals do your products have?',
    answer: 'Our products hold various regulatory approvals depending on the market. TORR RF has FDA 510(k) clearance for the US market and Korea MFDS approval. All products have Korea MFDS approval. We are continuously expanding our regulatory portfolio and can provide specific certification information for your target market upon request.',
    category: 'certifications',
  },
];

export const getFAQsByCategory = (category: FAQItem['category']) => 
  faqItems.filter(item => item.category === category);

export const getFAQById = (id: string) => 
  faqItems.find(item => item.id === id);
