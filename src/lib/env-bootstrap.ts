/**
 * 必须在任何读取 process.env 的模块（尤其 db.ts）之前被 import。
 * Next 在独立 server.ts 里启动时，静态 import 会先全部求值，故把 dotenv 放在单独文件并作为首 import。
 */
import { config } from "dotenv";
import path from "path";

const root = process.cwd();
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });
