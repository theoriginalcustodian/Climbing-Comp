export interface GoogleFormItem {
  id: string;
  name: string;
  createdTime?: string;
  webViewLink?: string;
}

export interface GoogleFormDetails {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  responderUri?: string;
  items?: Array<{
    itemId: string;
    title: string;
    questionItem?: {
      question: {
        questionId: string;
        required?: boolean;
      };
    };
  }>;
}

export interface GoogleFormResponseAnswer {
  questionId: string;
  value: string;
}

export interface GoogleFormSubmission {
  responseId: string;
  createTime: string;
  answers: Record<string, string>; // questionTitle -> answer value
}

// 1. List Google Forms from Drive
export async function listUserForms(accessToken: string): Promise<GoogleFormItem[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.form' and trashed=false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,webViewLink)&orderBy=createdTime%20desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Error al listar formularios de Google Drive');
  }

  const data = await response.json();
  return data.files || [];
}

// 2. Get details of a Google Form
export async function getFormDetails(
  accessToken: string,
  formId: string
): Promise<GoogleFormDetails> {
  const response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Error al obtener detalles del formulario');
  }

  return response.json();
}

// 3. Create a specialized Climbing Competition Registration Form
export async function createClimbingRegistrationForm(
  accessToken: string,
  title: string,
  description?: string
): Promise<GoogleFormDetails> {
  // Step A: Create initial form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: title || 'Inscripción Pachamama Escalada',
        description:
          description ||
          'Formulario oficial de registro de competidores para Pachamama Escalada.',
      },
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Error al crear el formulario en Google Forms');
  }

  const createdForm: GoogleFormDetails = await createRes.json();
  const formId = createdForm.formId;

  // Step B: Add registration questions via batchUpdate
  const batchUpdateRes = await fetch(
    `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            createItem: {
              item: {
                title: 'Nombre y Apellido del Competidor',
                description: 'Ingresa el nombre completo del escalador/a',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: {},
                  },
                },
              },
              location: { index: 0 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Categoría',
                description: 'Selecciona la categoría de competición',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: 'Senior Femenino' },
                        { value: 'Senior Masculino' },
                        { value: 'Juvenil Femenino' },
                        { value: 'Juvenil Masculino' },
                        { value: 'Promocional' },
                      ],
                    },
                  },
                },
              },
              location: { index: 1 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Club o Equipo',
                description: 'Nombre del club de escalada o Independiente',
                questionItem: {
                  question: {
                    required: false,
                    textQuestion: {},
                  },
                },
              },
              location: { index: 2 },
            },
          },
          {
            createItem: {
              item: {
                title: 'Número de Dorsal Preferido / Asignado',
                description: 'Opcional. Ej: 101, 102...',
                questionItem: {
                  question: {
                    required: false,
                    textQuestion: {},
                  },
                },
              },
              location: { index: 3 },
            },
          },
        ],
      }),
    }
  );

  if (!batchUpdateRes.ok) {
    console.warn('Batch update fields failed, returning basic created form');
  }

  // Refetch full structure
  return getFormDetails(accessToken, formId);
}

// 4. Fetch all responses submitted to a Google Form
export async function getFormSubmissions(
  accessToken: string,
  formId: string
): Promise<{ formTitle: string; submissions: GoogleFormSubmission[] }> {
  // Get Form structure first to map question IDs to question titles
  const formDetails = await getFormDetails(accessToken, formId);
  const questionMap = new Map<string, string>(); // questionId -> title

  if (formDetails.items) {
    for (const item of formDetails.items) {
      if (item.questionItem?.question?.questionId) {
        questionMap.set(item.questionItem.question.questionId, item.title);
      }
    }
  }

  // Get responses
  const response = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Error al obtener respuestas del formulario');
  }

  const data = await response.json();
  const rawResponses = data.responses || [];

  const submissions: GoogleFormSubmission[] = rawResponses.map((r: any) => {
    const answersObj: Record<string, string> = {};
    if (r.answers) {
      Object.keys(r.answers).forEach((qId) => {
        const title = questionMap.get(qId) || qId;
        const textAnswers = r.answers[qId]?.textAnswers?.answers || [];
        const answerVal = textAnswers.map((a: any) => a.value).join(', ');
        answersObj[title] = answerVal;
      });
    }
    return {
      responseId: r.responseId,
      createTime: r.createTime,
      answers: answersObj,
    };
  });

  return {
    formTitle: formDetails.info.title,
    submissions,
  };
}

// 5. Delete a Google Form file with explicit user confirmation handling in UI
export async function deleteFormFile(accessToken: string, formId: string): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${formId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Error al eliminar el formulario');
  }
}
