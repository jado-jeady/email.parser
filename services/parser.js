// parser.js

/**
 * Parses structured email content into application fields.
 * Handles multi-line values, inconsistent spacing, and flexible field markers.
 */

export function parseEmailContent(content) {
  // Normalize line breaks and spacing
  content = content.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n\n');

  // List of known fields in expected order
  const knownFields = [
    'Full Name',
    'Email',
    'Phone',
    'Company',
    'Project Name',
    'Sector',
    'Project Explanation',
    'Social/Environmental Impact',
    'Differentiation',
    'Innovation',
    'Concept Note Link',
    'Terms Accepted'
  ];

  /**
   * Extracts a field value from the email body.
   * @param {string} field - The label to search for (e.g. "Full Name")
   * @param {string} content - The full email body
   * @returns {string} - The extracted value or empty string
   */
  function getField(field, content) {
    const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nextFields = knownFields
      .filter(f => f !== field)
      .map(f => `\\n${f}:`)
      .join('|');

    const regex = new RegExp(
      `${escapedField}:\\s*([\\s\\S]*?)(?=${nextFields}|\\n-{3,}|\\n$)`,
      'i'
    );

    const match = content.match(regex);
    return match ? match[1].replace(/\r?\n/g, ' ').trim() : '';
  }

  // Extract all fields
  const parsed = {
    fullName: getField('Full Name', content),
    email: getField('Email', content),
    phone: getField('Phone', content),
    company: getField('Company', content),
    projectName: getField('Project Name', content),
    sector: getField('Sector', content),
    projectExplanation: getField('Project Explanation', content),
    socialImpact: getField('Social/Environmental Impact', content),
    differentiation: getField('Differentiation', content),
    innovation: getField('Innovation', content),
    conceptNoteLink: getField('Concept Note Link', content),
    termsAccepted: getField('Terms Accepted', content).toLowerCase() === 'true'
  };

  // Validate required fields
  if (!parsed.fullName || !parsed.email) {
    throw new Error('Failed to parse required fields from email');
  }

  return parsed;
}