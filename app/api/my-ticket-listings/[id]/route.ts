
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseListingId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

// Mark a seller's own listing as sold.
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const sellerId = await getSessionUserId();

    if (!sellerId) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const { id: rawId } = await context.params;
    const listingId = parseListingId(rawId);

    if (!listingId) {
      return NextResponse.json(
        { error: "Invalid listing ID." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    if (body.status !== "sold") {
      return NextResponse.json(
        { error: "Only the sold status is supported." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `UPDATE ticket_listings
       SET status = 'sold'
       WHERE id = ?
         AND seller_id = ?
         AND status = 'available'`,
      [listingId, sellerId]
    );

    const updateResult = result as { affectedRows: number };

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        {
          error:
            "Listing not found, not yours, or no longer available.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Listing marked as sold.",
      status: "sold",
    });
  } catch (error) {
    console.error("Marking ticket as sold failed:", error);

    return NextResponse.json(
      { error: "Unable to update this listing." },
      { status: 500 }
    );
  }
}

// Delete a seller's own listing.
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const sellerId = await getSessionUserId();

    if (!sellerId) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const { id: rawId } = await context.params;
    const listingId = parseListingId(rawId);

    if (!listingId) {
      return NextResponse.json(
        { error: "Invalid listing ID." },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `DELETE FROM ticket_listings
       WHERE id = ? AND seller_id = ?`,
      [listingId, sellerId]
    );

    const deleteResult = result as { affectedRows: number };

    if (deleteResult.affectedRows === 0) {
      return NextResponse.json(
        { error: "Listing not found or you do not own it." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Listing deleted successfully.",
    });
  } catch (error) {
    console.error("Deleting ticket listing failed:", error);

    return NextResponse.json(
      { error: "Unable to delete this listing." },
      { status: 500 }
    );
  }
}
