export async function fetchData(invoke: string, params: any) {
  try {
    const result = await window.ipcRenderer.invoke(invoke, params);
    return result;
  }
  catch (error) {
    console.error('Failed to fetch data:', error);
    return null;
  }
}

export async function postData(invoke: string, params: any) {
  try {
    const result = await window.ipcRenderer.invoke(invoke, params);
    return result;
  }
  catch (error) {
    console.error('Failed to post data:', error);
    return null;
  }
}
