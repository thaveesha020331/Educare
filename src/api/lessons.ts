import { LessonPlan } from '../screens/teacher/CreateLessonWizard';
import { apiRequest, getBaseUrlForDevice } from '../utils/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UploadResourceResponse {
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export const createLesson = async (plan: LessonPlan, token: string): Promise<ApiResponse<LessonPlan>> => {
  try {
    // Transform the lesson plan to match backend structure
    const lessonData = {
      title: plan.title,
      description: plan.objectives,
      content: plan.steps.map(step => step.instruction).join('\n\n'),
      classroomId: (plan as any).classroomId,
      subject: plan.subject,
      grade: plan.mode === 'special' ? 'Special Needs' : 'Normal',
      duration: 45, // Default duration
      attachments: plan.resources.map(resource => ({
        name: resource.name,
        url: resource.uri,
        type: resource.mime
      }))
    };

    const data = await apiRequest('/api/lessons', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(lessonData),
    });

    return {
      success: true,
      data: data.lesson,
    };
  } catch (error) {
    console.error('Create lesson error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const syncLessons = async (plans: LessonPlan[]): Promise<ApiResponse<{ synced: number; failed: number }>> => {
  try {
    const response = await fetch(`${getBaseUrlForDevice()}/api/lessons/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here if needed
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ lessons: plans }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to sync lessons');
    }

    return {
      success: true,
      data: {
        synced: data.synced || 0,
        failed: data.failed || 0,
      },
    };
  } catch (error) {
    console.error('Sync lessons error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const uploadResource = async (fileUri: string): Promise<ApiResponse<UploadResourceResponse>> => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = fileUri.split('/').pop() || 'resource';
    
    // Determine MIME type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';
    
    switch (extension) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'mp4':
        mimeType = 'video/mp4';
        break;
      case 'mov':
        mimeType = 'video/quicktime';
        break;
      default:
        break;
    }

    // Append file to FormData
    formData.append('resource', {
      uri: fileUri,
      type: mimeType,
      name: filename,
    } as any);

    const response = await fetch(`${getBaseUrlForDevice()}/api/lessons/upload-resource`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        // Add auth headers here if needed
        // 'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload resource');
    }

    return {
      success: true,
      data: {
        name: data.name,
        url: data.url,
        size: data.size,
        mimeType: data.mimeType,
      },
    };
  } catch (error) {
    console.error('Upload resource error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const getLessons = async (token: string): Promise<ApiResponse<any[]>> => {
  try {
    const data = await apiRequest('/api/lessons', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data: data.lessons || [],
    };
  } catch (error) {
    console.error('Get lessons error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const updateLesson = async (id: string, updates: Partial<LessonPlan>): Promise<ApiResponse<LessonPlan>> => {
  try {
    const response = await fetch(`${getBaseUrlForDevice()}/api/lessons/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here if needed
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update lesson');
    }

    return {
      success: true,
      data: data.lesson,
    };
  } catch (error) {
    console.error('Update lesson error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const deleteLesson = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await fetch(`${getBaseUrlForDevice()}/api/lessons/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers here if needed
        // 'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete lesson');
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete lesson error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Utility function to check if API is reachable
// Student API functions
export const getStudentLessons = async (token: string): Promise<ApiResponse<any[]>> => {
  try {
    const data = await apiRequest('/api/student/lessons', {
      method: 'GET',
    });

    return {
      success: true,
      data: data.lessons || [],
    };
  } catch (error) {
    console.error('Get student lessons error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const getStudentQuizzes = async (token: string): Promise<ApiResponse<any[]>> => {
  try {
    const data = await apiRequest('/api/student/quizzes', {
      method: 'GET',
    });

    return {
      success: true,
      data: data.quizzes || [],
    };
  } catch (error) {
    console.error('Get student quizzes error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const completeLesson = async (lessonId: string, timeSpent: number, token: string): Promise<ApiResponse<void>> => {
  try {
    await apiRequest(`/api/student/lessons/${lessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ timeSpent }),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Complete lesson error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const submitQuiz = async (quizId: string, answers: any[], timeSpent: number, token: string): Promise<ApiResponse<any>> => {
  try {
    const data = await apiRequest(`/api/student/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, timeSpent }),
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Submit quiz error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const getStudentProgress = async (token: string): Promise<ApiResponse<any>> => {
  try {
    const data = await apiRequest('/api/student/progress', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Get student progress error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Quiz API functions
export const createQuiz = async (quizData: any, token: string): Promise<ApiResponse<any>> => {
  try {
    const data = await apiRequest('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(quizData),
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Create quiz error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const getQuizzes = async (token: string): Promise<ApiResponse<any[]>> => {
  try {
    const data = await apiRequest('/api/quizzes', {
      method: 'GET',
    });

    return {
      success: true,
      data: data.quizzes || [],
    };
  } catch (error) {
    console.error('Get quizzes error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getBaseUrlForDevice()}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default {
  createLesson,
  syncLessons,
  uploadResource,
  getLessons,
  updateLesson,
  deleteLesson,
  getStudentLessons,
  getStudentQuizzes,
  completeLesson,
  submitQuiz,
  getStudentProgress,
  createQuiz,
  getQuizzes,
  checkApiHealth,
};
