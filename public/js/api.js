// Unified API Client for Gunotsav 2.0 Backend Services
const API = {
  // Fetch school details by UDISE code
  async getSchool(udise) {
    const res = await fetch(`/api/schools/${udise}`);
    if (res.status === 404) {
      return { success: false, status: 404, message: 'School not found' };
    }
    if (!res.ok) throw new Error('Failed to load school details from server');
    return res.json();
  },

  // Save/Upsert school details
  async saveSchool(schoolData) {
    const res = await fetch('/api/schools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(schoolData)
    });
    if (!res.ok) throw new Error('Failed to save school details');
    return res.json();
  },

  // Get all checklist items (draft text and tables) for a school
  async getItemData(schoolId) {
    const res = await fetch(`/api/schools/${schoolId}/items`);
    if (!res.ok) throw new Error('Failed to retrieve item reports from server');
    return res.json();
  },

  // Save checklist item details (draft text and/or table data)
  async saveItemData(schoolId, itemKey, draftText, tableData) {
    const res = await fetch(`/api/schools/${schoolId}/items/${itemKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ draftText, tableData })
    });
    if (!res.ok) throw new Error('Failed to save item details');
    return res.json();
  },

  // Get all media records uploaded for a school
  async getMedia(schoolId) {
    const res = await fetch(`/api/schools/${schoolId}/media`);
    if (!res.ok) throw new Error('Failed to load school media files');
    return res.json();
  },

  // Upload file (PDF/Image) for a specific checklist item
  async uploadMedia(schoolId, itemKey, file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`/api/schools/${schoolId}/items/${itemKey}/media`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('File upload request failed');
    return res.json();
  },

  // Delete an uploaded media record by its ID
  async deleteMedia(mediaId) {
    const res = await fetch(`/api/media/${mediaId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('File deletion request failed');
    return res.json();
  },

  // Reset all checklist drafts and media for a school
  async resetSchoolData(schoolId) {
    const res = await fetch(`/api/schools/${schoolId}/reset`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reset school database data');
    return res.json();
  }
};
