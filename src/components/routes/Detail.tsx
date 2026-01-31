import { Result, useAtomSet, useAtomValue } from "@effect-atom/atom-react";
import { deletePieceAtom, getPhotoUrlAtom } from "../../effect/client/atom";
import { NavigationBar } from "../NavigationBar";
import { DeleteModal } from "../DeleteModal";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export const Detail = () => {
  const { id } = useParams();
  const url = useAtomValue(getPhotoUrlAtom(id!));
  const src = Result.isSuccess(url) ? url.value : undefined;
  const [, navigate] = useLocation();
  const deletePiece = useAtomSet(deletePieceAtom);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    if (id) {
      deletePiece(id);
      navigate("/");
    }
  };

  return (
    <>
      <NavigationBar variant="detail" onBack={() => navigate("/")} />
      <div className="px-5">
        <h1>Detail</h1>
        <img src={src} />
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-danger-500 hover:bg-danger-500/5 active:bg-danger-500/10"
        >
          <Trash2 className="h-5 w-5" />
          Delete Piece
        </button>
      </div>
      <DeleteModal
        count={1}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
      />
    </>
  );
};
