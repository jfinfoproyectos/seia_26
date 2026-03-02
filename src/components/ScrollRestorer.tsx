"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollRestorer() {
    const pathname = usePathname();

    useEffect(() => {
        // En Next.js, si el usuario navega mientras hay un Dialog o Sheet de Radix abierto,
        // Radix a veces falla en limpiar el estilo del body (overflow: hidden y pointer-events: none)
        // Esto fuerza a que el body recupere su scroll normal cuando cambia la URL
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";

        // Fix for specific data attributes Radix adds
        document.body.removeAttribute("data-scroll-locked");
    }, [pathname]);

    return null;
}
