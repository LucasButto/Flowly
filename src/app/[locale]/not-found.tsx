"use client";
import { Link } from "@/navigation";
import Brand from "@/components/layout/Brand/Brand";
import "./not-found.scss";

export default function NotFound() {
  return (
    <div className="notfound">
      <Brand size={44} />
      <h1 className="notfound__code">404</h1>
      <p className="notfound__text">No encontramos esta página.</p>
      <Link href="/" className="notfound__link">
        Volver al inicio
      </Link>
    </div>
  );
}
