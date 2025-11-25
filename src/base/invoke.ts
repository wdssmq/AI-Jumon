export const fetchData = async (invoke: string, params: any) => {
  try {
    // @ts-ignore
    const result = await window.ipcRenderer.invoke(invoke, params);
    return result;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return null;
  }
}

export const postData = async (invoke: string, params: any) => {
  try {
    // @ts-ignore
    const result = await window.ipcRenderer.invoke(invoke, params);
    return result;
  } catch (error) {
    console.error('Failed to post data:', error);
    return null;
  }
}
