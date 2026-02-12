// Keystatic Configuration for BRITZMEDI Global Website
import { config, collection, fields } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },

  collections: {
    // Blog Collection
    blog: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
            validation: { isRequired: true }
          }
        }),
        description: fields.text({
          label: 'Meta Description',
          multiline: true,
          validation: { isRequired: true }
        }),
        tldr: fields.text({
          label: 'TL;DR Summary',
          multiline: true,
          description: 'A brief 2-3 sentence summary for AI and quick readers'
        }),
        author: fields.text({
          label: 'Author',
          defaultValue: 'BRITZMEDI Team'
        }),
        thumbnail: fields.image({
          label: 'Thumbnail Image',
          directory: 'public/images/blog',
          publicPath: '/images/blog/',
          description: 'Optional thumbnail for blog list cards (recommended: 800x450px)'
        }),
        status: fields.select({
          label: 'Publishing Status',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Published', value: 'published' }
          ],
          defaultValue: 'draft',
          description: 'Draft = admin only, Scheduled = auto-publish at scheduled date, Published = visible on site'
        }),
        scheduledDate: fields.datetime({
          label: 'Scheduled Publish Date',
          description: 'Required when status is "scheduled". Post will auto-publish at this date/time.'
        }),
        publishDate: fields.datetime({
          label: 'Publish Date',
          description: 'The date this post was or will be published'
        }),
        publishedAt: fields.date({
          label: 'Published Date (Legacy)',
          validation: { isRequired: true },
          description: 'Legacy field - use Publish Date for new posts'
        }),
        updatedAt: fields.date({
          label: 'Updated Date'
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Industry News', value: 'industry-news' },
            { label: 'Product Updates', value: 'product-updates' },
            { label: 'Technology', value: 'technology' },
            { label: 'Clinical Studies', value: 'clinical-studies' },
            { label: 'Company News', value: 'company-news' },
            { label: 'Education', value: 'education' }
          ],
          defaultValue: 'industry-news'
        }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          {
            label: 'Tags',
            itemLabel: props => props.value || 'Tag'
          }
        ),
        featuredImage: fields.image({
          label: 'Featured Image',
          directory: 'public/images/blog',
          publicPath: '/images/blog/'
        }),
        featured: fields.checkbox({
          label: 'Featured Post',
          defaultValue: false
        }),
        content: fields.markdoc({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/blog',
              publicPath: '/images/blog/'
            }
          }
        })
      }
    }),

    // Products Collection
    products: collection({
      label: 'Products',
      slugField: 'name',
      path: 'src/content/products/*/',
      format: { data: 'json' },
      schema: {
        name: fields.slug({
          name: {
            label: 'Product Name',
            validation: { isRequired: true }
          }
        }),
        model: fields.text({
          label: 'Model Number',
          validation: { isRequired: true }
        }),
        tagline: fields.text({
          label: 'Tagline',
          validation: { isRequired: true }
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Medical Device', value: 'medical-device' },
            { label: 'Cosmetic', value: 'cosmetic' }
          ],
          defaultValue: 'medical-device'
        }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Coming Soon', value: 'coming-soon' }
          ],
          defaultValue: 'available'
        }),
        featured: fields.checkbox({
          label: 'Featured Product',
          defaultValue: false
        }),
        mainImage: fields.image({
          label: 'Main Product Image',
          directory: 'public/images/products',
          publicPath: '/images/products/',
          description: 'Primary hero image for the product (drag & drop to upload)'
        }),
        logo: fields.text({
          label: 'Logo Image Path',
          description: 'Full path e.g. /images/logos/torr-rf-logo.png'
        }),
        gallery: fields.array(
          fields.text({
            label: 'Image Path',
            description: 'Full path e.g. /images/products/torr-rf/torrrf-01.webp',
          }),
          {
            label: 'Product Gallery',
            itemLabel: props => props.value?.split('/').pop() || 'Image',
            description: 'Additional product images (full paths)'
          }
        ),
        handpieceImages: fields.array(
          fields.object({
            key: fields.text({ label: 'Image Key', description: 'e.g. body-deep, face-super, eye' }),
            path: fields.text({ label: 'Image Path', description: 'Full path e.g. /images/products/torr-rf/body-handpiece-deep.webp' }),
          }),
          {
            label: 'Handpiece Images',
            itemLabel: props => props.fields.key.value || 'Image',
            description: 'Key-path pairs for handpiece-specific images'
          }
        ),
        overview: fields.text({
          label: 'Overview',
          multiline: true,
          validation: { isRequired: true }
        }),
        description: fields.text({
          label: 'Detailed Description',
          multiline: true,
        }),
        keyTechnologies: fields.array(
          fields.object({
            name: fields.text({ label: 'Technology Name' }),
            description: fields.text({ label: 'Description', multiline: true })
          }),
          {
            label: 'Key Technologies',
            itemLabel: props => props.fields.name.value || 'Technology'
          }
        ),
        indications: fields.array(
          fields.text({ label: 'Indication' }),
          {
            label: 'Indications',
            itemLabel: props => props.value || 'Indication'
          }
        ),
        specifications: fields.array(
          fields.object({
            label: fields.text({ label: 'Specification Label' }),
            value: fields.text({ label: 'Value' }),
            note: fields.text({ label: 'Note (optional)' })
          }),
          {
            label: 'Specifications',
            itemLabel: props => props.fields.label.value || 'Spec'
          }
        ),
        handpieces: fields.array(
          fields.object({
            name: fields.text({ label: 'Handpiece Name' }),
            tipSize: fields.text({ label: 'Tip Size' }),
            depth: fields.text({ label: 'Treatment Depth' }),
            feature: fields.text({ label: 'Key Feature', multiline: true }),
          }),
          {
            label: 'Handpieces',
            itemLabel: props => props.fields.name.value || 'Handpiece'
          }
        ),
        certifications: fields.array(
          fields.object({
            name: fields.text({ label: 'Certification Name' }),
            status: fields.text({ label: 'Status' }),
            detail: fields.text({ label: 'Detail (optional)' })
          }),
          {
            label: 'Certifications',
            itemLabel: props => props.fields.name.value || 'Certification'
          }
        ),
        clinicalBenefits: fields.array(
          fields.text({ label: 'Benefit' }),
          {
            label: 'Clinical Benefits',
            itemLabel: props => props.value || 'Benefit'
          }
        ),
        differentiators: fields.array(
          fields.object({
            feature: fields.text({ label: 'Feature Name' }),
            description: fields.text({ label: 'Description', multiline: true })
          }),
          {
            label: 'Differentiators',
            itemLabel: props => props.fields.feature.value || 'Differentiator'
          }
        ),
      }
    }),

    // FAQ Collection
    faq: collection({
      label: 'FAQ',
      slugField: 'question',
      path: 'src/content/faq/*/',
      format: { data: 'yaml' },
      schema: {
        question: fields.slug({
          name: {
            label: 'Question',
            validation: { isRequired: true }
          }
        }),
        answer: fields.text({
          label: 'Answer',
          multiline: true,
          validation: { isRequired: true }
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Products', value: 'products' },
            { label: 'Company', value: 'company' },
            { label: 'Ordering & Distribution', value: 'ordering' },
            { label: 'Technical Support', value: 'technical' },
            { label: 'Certifications', value: 'certifications' }
          ],
          defaultValue: 'products'
        }),
      }
    }),

    // Resources Collection
    resources: collection({
      label: 'Resources',
      slugField: 'title',
      path: 'src/content/resources/*/',
      format: { data: 'yaml' },
      schema: {
        title: fields.slug({ 
          name: { 
            label: 'Resource Title',
            validation: { isRequired: true }
          } 
        }),
        description: fields.text({ 
          label: 'Description',
          multiline: true,
          validation: { isRequired: true }
        }),
        type: fields.select({
          label: 'File Type',
          options: [
            { label: 'PDF', value: 'pdf' },
            { label: 'PowerPoint', value: 'ppt' },
            { label: 'Video', value: 'video' },
            { label: 'Image', value: 'image' },
            { label: 'Brochure', value: 'brochure' }
          ],
          defaultValue: 'pdf'
        }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Product Brochure', value: 'product-brochure' },
            { label: 'Technical Documents', value: 'technical-docs' },
            { label: 'Marketing Materials', value: 'marketing' },
            { label: 'Certificates', value: 'certificates' },
            { label: 'Videos', value: 'videos' }
          ],
          defaultValue: 'product-brochure'
        }),
        driveUrl: fields.url({ 
          label: 'Google Drive URL',
          validation: { isRequired: true }
        }),
        fileSize: fields.text({ 
          label: 'File Size (e.g., 5.2 MB)',
        }),
        language: fields.text({ 
          label: 'Language',
          defaultValue: 'English'
        }),
        product: fields.text({ 
          label: 'Related Product (optional)',
          description: 'Enter product name if this resource is product-specific'
        }),
        thumbnail: fields.image({
          label: 'Thumbnail Image (optional)',
          description: 'Recommended: 800x800px, JPEG, under 200KB',
          directory: 'public/images/resources',
          publicPath: '/images/resources/',
        }),
      }
    }),

    // Company Information (Singleton)
    company: collection({
      label: 'Company Info',
      slugField: 'name',
      path: 'src/content/company/*/',
      format: { data: 'yaml' },
      schema: {
        name: fields.slug({
          name: {
            label: 'Company Name',
            validation: { isRequired: true }
          }
        }),
        nameKo: fields.text({ label: 'Korean Name' }),
        ceo: fields.text({ label: 'CEO Name' }),
        establishment: fields.text({ label: 'Establishment Date' }),
        description: fields.text({
          label: 'Company Description',
          multiline: true
        }),
        philosophy: fields.text({
          label: 'Company Philosophy',
          multiline: true
        }),
        address: fields.object({
          full: fields.text({ label: 'Full Address' }),
          city: fields.text({ label: 'City' }),
          province: fields.text({ label: 'Province/State' }),
          country: fields.text({ label: 'Country' }),
          postalCode: fields.text({ label: 'Postal Code' }),
        }),
        contact: fields.object({
          phone: fields.text({ label: 'Phone' }),
          email: fields.text({ label: 'Email' }),
          website: fields.text({ label: 'Website' }),
        }),
        milestones: fields.array(
          fields.object({
            year: fields.text({ label: 'Year' }),
            title: fields.text({ label: 'Milestone Title' }),
            description: fields.text({ label: 'Description', multiline: true }),
            upcoming: fields.checkbox({ label: 'Upcoming Milestone' })
          }),
          {
            label: 'Company Milestones',
            itemLabel: props => `${props.fields.year.value} - ${props.fields.title.value}` || 'Milestone'
          }
        ),
      }
    }),

    // Certifications Collection
    certifications: collection({
      label: 'Certifications',
      slugField: 'name',
      path: 'src/content/certifications/*/',
      format: { data: 'yaml' },
      schema: {
        name: fields.slug({ 
          name: { 
            label: 'Certification Short Name',
            validation: { isRequired: true }
          } 
        }),
        fullName: fields.text({ 
          label: 'Full Certification Name',
          validation: { isRequired: true }
        }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Certified', value: 'certified' },
            { label: 'Cleared', value: 'cleared' },
            { label: 'Registered', value: 'registered' },
            { label: 'In Preparation', value: 'in-preparation' },
            { label: 'Planned', value: 'planned' }
          ],
          defaultValue: 'certified'
        }),
        region: fields.text({ 
          label: 'Region/Country',
          validation: { isRequired: true }
        }),
        description: fields.text({ 
          label: 'Description',
          multiline: true,
          validation: { isRequired: true }
        }),
        products: fields.array(
          fields.text({ label: 'Product Name' }),
          {
            label: 'Applicable Products',
            itemLabel: props => props.value || 'Product'
          }
        ),
        certificateNo: fields.text({ 
          label: 'Certificate Number (optional)'
        }),
        validUntil: fields.text({ 
          label: 'Valid Until (optional)'
        }),
      }
    }),
  },
});
