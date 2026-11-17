import type { ReactElement } from "react";
import type { Values } from "@/domain/models/product";
import { Slide1Drawing } from "./Slide1Drawing";
import { RigidDrawing } from "./RigidDrawing";
import { Swing1Drawing } from "./Swing1Drawing";
import { Slide2Drawing } from "./Slide2Drawing";
import { Swing2Drawing } from "./Swing2Drawing";
import { FlexibleDrawing } from "./FlexibleDrawing";

interface DrawingProps {
  v: Values;
  o: Values;
}

export function getProductDrawing(productId: string): (props: DrawingProps) => ReactElement {
  switch (productId) {
    case "corredera-1":
      return Slide1Drawing;
    case "rigida-enmarcada":
      return (props) => <RigidDrawing {...props} framed={true} />;
    case "rigida-sin-marco":
      return (props) => <RigidDrawing {...props} framed={false} />;
    case "giratoria-1":
      return Swing1Drawing;
    case "corredera-2": 
      return Slide2Drawing;
    case "giratoria-2": 
      return Swing2Drawing;
    case "simple-torsion":
    case "triple-torsion":
    case "anudada":
    case "otro":
      return FlexibleDrawing;
    default:
      return Slide1Drawing;
  }
}