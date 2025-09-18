// parser.js

/**
 * Parses structured email content into application fields.
 * Handles multi-line values, inconsistent spacing, flexible field markers (e.g. *, spaces).
 */

export function parseEmailContent(content) {
  // Normalize line breaks
  content = content.replace(/\r\n/g, '\n');

  // Optionally collapse multiple blank lines (not strictly needed)
  // content = content.replace(/\n{2,}/g, '\n\n');

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

    // Build a pattern for the next field(s): allow preceding newline OR *, or spaces
    const nextFields = knownFields
      .filter(f => f !== field)
      .map(f => `(?:\\n|\\*\\s*|\\s+)${f}:`)
      .join('|');

    const regex = new RegExp(
      `${escapedField}:\\s*([\\s\\S]*?)(?=${nextFields}|\\n-{3,}|\\n$)`,
      'i'
    );

    const match = content.match(regex);
    if (!match) {
      return '';
    }

    // Clean the captured part:
    // - Remove any leading/trailing asterisks
    // - Remove asterisks inside
    // - Replace newline with space
    // - Normalize multiple spaces
    let value = match[1];
    value = value.replace(/\*/g, '');            // remove all '*'
    value = value.replace(/\r?\n/g, ' ');         // newlines → spaces
    value = value.replace(/\s{2,}/g, ' ');        // collapse double spaces
    return value.trim();
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
    // Convert 'true'/'false' (case-insensitive) to boolean
    termsAccepted: (() => {
      const t = getField('Terms Accepted', content).toLowerCase();
      return t === 'true';
    })()
  };

  // Validate required fields (you can extend this)
  if (!parsed.fullName || !parsed.email) {
    throw new Error('Failed to parse required fields from email');
  }

  return parsed;
}
