export class GoogleDrive {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private teamDriveId: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(env: any) {
    this.clientId = env.GDRIVE_CLIENT_ID;
    this.clientSecret = env.GDRIVE_CLIENT_SECRET;
    this.refreshToken = env.GDRIVE_REFRESH_TOKEN;
    this.teamDriveId = env.GDRIVE_TEAM_DRIVE_ID;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${await response.text()}`);
    }

    const data: any = await response.json();
    this.accessToken = data.access_token;
    // Assume token expires in data.expires_in seconds, subtract 60s for safety buffer
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    
    return this.accessToken;
  }

  async listFolder(folderId: string = 'root') {
    const token = await this.getAccessToken();
    let url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,createdTime)&includeItemsFromAllDrives=true&supportsAllDrives=true`;
    
    if (folderId === 'root' && this.teamDriveId && this.teamDriveId.trim() !== '') {
      url = `https://www.googleapis.com/drive/v3/files?q='${this.teamDriveId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,createdTime)&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&driveId=${this.teamDriveId}`;
    }

    let res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    let data: any = null;
    if (res.ok) {
      data = await res.json();
    }

    if ((!res.ok || !data || !data.files || data.files.length === 0) && folderId === 'root') {
      url = `https://www.googleapis.com/drive/v3/files?q='root'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,createdTime)&includeItemsFromAllDrives=true&supportsAllDrives=true`;
      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        data = await res.json();
      }
    }

    if (!res.ok) {
      throw new Error(`Failed to list folder: ${await res.text()}`);
    }

    return data;
  }

  async uploadFile(fileName: string, mimeType: string, parentFolderId: string, streamOrBuffer: any): Promise<string> {
    const token = await this.getAccessToken();
    
    const metadata: any = {
      name: fileName,
    };
    if (parentFolderId && parentFolderId !== 'root') {
      metadata.parents = [parentFolderId];
    }
    
    let initRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": mimeType
      },
      body: JSON.stringify(metadata)
    });
    
    if (!initRes.ok && metadata.parents) {
      delete metadata.parents;
      initRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": mimeType
        },
        body: JSON.stringify(metadata)
      });
    }
    
    if (!initRes.ok) throw new Error("Failed to init upload: " + await initRes.text());
    
    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) throw new Error("No upload URL returned");
    
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType
      },
      body: streamOrBuffer
    });
    
    if (!uploadRes.ok) throw new Error("Failed to upload: " + await uploadRes.text());
    
    const result: any = await uploadRes.json();
    return result.id;
  }

  async getFile(fileId: string): Promise<any> {
    const token = await this.getAccessToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,parents,trashed&supportsAllDrives=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  }

  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    const token = await this.getAccessToken();
    const metadata: any = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder"
    };
    if (parentFolderId && parentFolderId !== 'root') {
      metadata.parents = [parentFolderId];
    } else if (this.teamDriveId && this.teamDriveId.trim() !== '') {
      metadata.parents = [this.teamDriveId];
    }
    let res = await fetch("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(metadata)
    });
    if (!res.ok && metadata.parents) {
      delete metadata.parents;
      this.teamDriveId = '';
      res = await fetch("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(metadata)
      });
    }
    if (!res.ok) throw new Error(`Failed to create folder: ${await res.text()}`);
    const data: any = await res.json();
    return data.id;
  }
}
