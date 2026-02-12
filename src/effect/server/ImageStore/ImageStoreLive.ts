import { isCloudflare } from "../utils/cloudflare";
import { ImageStoreCloudflare } from "./ImageStoreCloudflare";
import { ImageStoreNode } from "./ImageStoreNode";

export const ImageStoreLive = isCloudflare()
  ? ImageStoreCloudflare
  : ImageStoreNode;
