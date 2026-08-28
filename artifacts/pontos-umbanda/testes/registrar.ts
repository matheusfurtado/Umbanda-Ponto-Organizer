/** Liga o resolver antes de qualquer teste importar código do app. */
import { register } from "node:module";
register("./resolver.ts", import.meta.url);
