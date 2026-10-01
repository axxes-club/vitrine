import Link from "next/link";
import WaitlistForm from "@/app/WaitlistForm";
/** Registration creates an account; collection access requires its owner's grant. */
export function AwaitingAccess({ name, email }: { name?: string; email?: string }) {
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"6vw 1.5rem",background:"#f7f5ef"}}>
    <div style={{maxWidth:"34rem",width:"100%"}}>
      <Link href="/" className="wordmark">Vitrine</Link>
      <h1 className="serif" style={{fontSize:"clamp(2rem,5vw,3rem)",fontWeight:400,lineHeight:1.1,marginTop:32}}>Your account is ready.</h1>
      <p style={{marginTop:20,color:"var(--muted)",lineHeight:1.7}}>{name ? `${name}, you’re` : "You’re"} signed in{email ? ` as ${email}` : ""}. Collection access opens once your membership is activated or a collection owner invites you to their team.</p>
      <p style={{marginTop:16,marginBottom:26,color:"var(--muted)",lineHeight:1.7}}>Membership activation is arranged with the Vitrine team. You can request access below.</p>
      <WaitlistForm initialEmail={email} />
      <div style={{display:"flex",gap:24,marginTop:28,fontSize:13}}><Link href="/#membership">Explore memberships</Link><a href="/api/auth/sign-out">Sign out</a></div>
    </div>
  </main>;
}
