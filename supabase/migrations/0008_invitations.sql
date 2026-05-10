-- Wedding invitations
-- Pending invites live here until the invitee signs up / accepts. Once
-- accepted, a wedding_members row is created and the invitation status is
-- updated to 'accepted'. Revoked invites stay in the table to give the
-- workspace owner a verifiable history of who was invited.

CREATE TYPE wedding_invitation_status AS ENUM (
  'pending', 'accepted', 'revoked', 'expired'
);

CREATE TABLE IF NOT EXISTS wedding_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id      uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  email           text NOT NULL,
  role            member_role NOT NULL DEFAULT 'viewer',
  token           text NOT NULL UNIQUE,
  status          wedding_invitation_status NOT NULL DEFAULT 'pending',
  invited_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at      timestamptz NOT NULL DEFAULT now(),
  responded_at    timestamptz,
  accepted_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at      timestamptz NOT NULL DEFAULT (now() + INTERVAL '14 days')
);

CREATE INDEX idx_wedding_invitations_wedding ON wedding_invitations(wedding_id);
CREATE INDEX idx_wedding_invitations_email   ON wedding_invitations(lower(email));
CREATE INDEX idx_wedding_invitations_token   ON wedding_invitations(token);
