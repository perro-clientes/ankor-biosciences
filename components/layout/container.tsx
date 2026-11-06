import * as React from "react";
import { cn } from "@/lib/utils";

/** Contenedor del sitio: 1360px máx., 20px de padding en mobile y 40px desde md. */
function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-site px-5 md:px-10", className)} {...props} />;
}

export { Container };
