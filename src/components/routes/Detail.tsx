import { Result, useAtomValue } from "@effect-atom/atom-react";
import { getPhotoUrlAtom } from "../../effect/client/atom";
import { useParams } from "wouter";

export const Detail = () => {
  const { id } = useParams();
  const url = useAtomValue(getPhotoUrlAtom(id!));
  const src = Result.isSuccess(url) ? url.value : undefined;
  return (
    <div className="px-5">
      <h1>Detail</h1>
      <img src={src} />
    </div>
  );
};
