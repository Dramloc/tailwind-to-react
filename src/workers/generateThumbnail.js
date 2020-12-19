// @ts-check
import html2canvas from "html2canvas";

/** @type {(canvas: HTMLCanvasElement) => Promise<Blob>} */
const toBlob = (canvas) => {
  return new Promise((resolve) => {
    canvas.toBlob(resolve);
  });
};

/** @type {(element: HTMLElement) => Promise<Blob>} */
export const generateThumbnail = async (element) => {
  const canvas = await html2canvas(element, { backgroundColor: null });
  const blob = await toBlob(canvas);
  return blob;
};
