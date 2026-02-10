import { isCloudflare } from "../utils/cloudflare";
import { UserDocumentServiceCloudflare } from "./UserDocumentServiceCloudflare";
import { UserDocumentServiceNode } from "./UserDocumentServiceNode";

export const UserDocumentServiceLive = isCloudflare()
  ? UserDocumentServiceCloudflare
  : UserDocumentServiceNode;
