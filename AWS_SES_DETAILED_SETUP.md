# AWS SES Detailed Setup Guide - Step by Step

## Prerequisites
✅ AWS Account Created (You've done this!)

---

## Step 1: Access AWS SES Console

1. Go to https://console.aws.amazon.com/
2. Sign in with your AWS account
3. In the top search bar, type "SES" or "Simple Email Service"
4. Click on **Simple Email Service** from the results
5. **Important**: Check the region in the top-right corner. Choose a region close to you (e.g., `us-east-1`, `us-west-2`, `eu-west-1`). **Remember this region** - you'll need it later!

---

## Step 2: Verify Your Domain (finflow42.com)

### 2.1 Create Domain Identity

1. In the SES Console, click on **Verified identities** in the left sidebar
2. Click the **Create identity** button (top right)
3. Select **Domain** (not Email address)
4. In the **Domain** field, enter: `finflow42.com`
5. **DO NOT** check "Use a default DKIM signing key" (we'll use custom)
6. Click **Create identity**

### 2.2 Add DNS Records

AWS will show you DNS records to add. You'll need to add these to your domain's DNS settings (wherever you manage DNS - GoDaddy, Namecheap, Cloudflare, etc.)

#### Record 1: SPF Record (TXT)
- **Type**: TXT
- **Name/Host**: `@` or `finflow42.com` (depends on your DNS provider)
- **Value**: `v=spf1 include:amazonses.com ~all`
- **TTL**: 3600 (or default)

#### Record 2-4: DKIM Records (CNAME)
AWS will provide 3 CNAME records. They look like:
- **Type**: CNAME
- **Name**: `xxxxx._domainkey.finflow42.com`
- **Value**: `xxxxx.dkim.amazonses.com`
- **TTL**: 3600 (or default)

Add all 3 CNAME records exactly as AWS shows them.

#### Record 5: DMARC Record (TXT) - Optional but Recommended
- **Type**: TXT
- **Name/Host**: `_dmarc.finflow42.com`
- **Value**: `v=DMARC1; p=quarantine; rua=mailto:dmarc@finflow42.com`
- **TTL**: 3600 (or default)

### 2.3 Add Records to Your DNS

**Where to add DNS records:**
- **GoDaddy**: Go to your domain → DNS Management → Add records
- **Namecheap**: Domain List → Manage → Advanced DNS → Add records
- **Cloudflare**: Select domain → DNS → Add record
- **Other providers**: Look for "DNS Management" or "DNS Settings"

**Important Notes:**
- DNS changes can take 24-48 hours to propagate (usually much faster)
- You can verify records are live using: https://mxtoolbox.com/spf.aspx or https://www.dmarcanalyzer.com/

### 2.4 Wait for Verification

1. Go back to AWS SES Console → **Verified identities**
2. You should see `finflow42.com` with status "Pending verification"
3. Click on the domain to see verification status
4. Once all DNS records are detected, status will change to "Verified" (green checkmark)
5. This can take a few minutes to 48 hours

---

## Step 3: Request Production Access (IMPORTANT!)

By default, AWS SES is in **Sandbox mode** which only allows sending to verified email addresses.

### 3.1 Request Production Access

1. In SES Console, click **Account dashboard** in the left sidebar
2. You'll see "Your account is in the Amazon SES sandbox"
3. Click **Request production access** button
4. Fill out the form:

   **Use case description:**
   ```
   FinFlow42 is a personal finance tracking application. We need to send:
   - Email verification codes (OTP) for user registration
   - Password reset codes
   - Account notifications
   
   We expect to send approximately 1,000-5,000 emails per month initially.
   ```

   **Website URL**: `https://finflow42.com`
   
   **Mail Type**: Select "Transactional"
   
   **Describe how you plan to handle bounces and complaints**: 
   ```
   We will monitor bounce and complaint rates through AWS SES metrics.
   We have unsubscribe mechanisms in place for transactional emails.
   We will remove bounced email addresses from our database.
   ```

5. Click **Submit**
6. Approval usually takes 24-48 hours (sometimes faster)
7. You'll receive an email when approved

**Note**: While waiting for approval, you can still test by verifying individual email addresses in SES.

---

## Step 4: Create IAM User for SES

### 4.1 Create IAM User

1. In AWS Console, search for "IAM" in the top search bar
2. Click on **IAM** (Identity and Access Management)
3. Click **Users** in the left sidebar
4. Click **Create user** button
5. **User name**: `finflow42-ses-user`
6. Click **Next**

### 4.2 Attach Permissions

1. Select **Attach policies directly**
2. In the search box, type: `SES`
3. Find and check: **AmazonSESFullAccess**
   - (Alternatively, you can create a custom policy with only `ses:SendEmail` permission for better security)
4. Click **Next**
5. Review and click **Create user**

### 4.3 Create Access Keys

1. Click on the user you just created (`finflow42-ses-user`)
2. Click the **Security credentials** tab
3. Scroll down to **Access keys** section
4. Click **Create access key**
5. Select **Application running outside AWS**
6. Click **Next**
7. (Optional) Add description: "FinFlow42 SES Access"
8. Click **Create access key**

### 4.4 Save Your Credentials

**⚠️ CRITICAL: Save these now - you can only see the secret key once!**

1. **Access key ID**: Copy this (starts with `AKIA...`)
2. **Secret access key**: Click "Show" and copy this (long string)
3. **Save both securely** - you'll need them for your `.env.local` file

**Security Tip**: Never commit these to git! Only use in environment variables.

---

## Step 5: Configure Your Application

### 5.1 Add Environment Variables

Create or edit `.env.local` in your project root:

```env
# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_SES_FROM_EMAIL=noreply@finflow42.com
AWS_SES_FROM_NAME=FinFlow42

# Optional: Keep old SMTP settings as fallback
# SMTP_SERVICE=gmail
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
```

**Important:**
- Replace `AWS_REGION` with the region you selected in Step 1 (e.g., `us-east-1`, `us-west-2`)
- Replace `AWS_ACCESS_KEY_ID` with your actual access key
- Replace `AWS_SECRET_ACCESS_KEY` with your actual secret key
- The email `noreply@finflow42.com` will be used as the sender (make sure your domain is verified)

### 5.2 Restart Your Development Server

After adding environment variables:
```bash
# Stop your current server (Ctrl+C)
npm run dev
```

---

## Step 6: Test Email Sending

### 6.1 Test with Verified Email (Sandbox Mode)

If you're still in sandbox mode:

1. In SES Console → **Verified identities**
2. Click **Create identity** → **Email address**
3. Enter your personal email (e.g., `your-email@gmail.com`)
4. Check your email and click the verification link
5. Now test sending an OTP or password reset from your app
6. Check your inbox!

### 6.2 Test After Production Access

Once you have production access:
- You can send to any email address
- Test with any email you want

### 6.3 Check SES Console

1. Go to SES Console → **Account dashboard**
2. Check **Sending statistics**:
   - Emails sent
   - Bounce rate
   - Complaint rate
3. Go to **Verified identities** → Click your domain
4. Check **Sending statistics** for your domain

---

## Step 7: Monitor and Maintain

### 7.1 Set Up CloudWatch Alarms (Optional but Recommended)

1. In SES Console → **Account dashboard**
2. Set up alarms for:
   - High bounce rate (> 5%)
   - High complaint rate (> 0.1%)
   - Sending quota reached

### 7.2 Best Practices

1. **Monitor bounce rates**: Keep below 5%
2. **Monitor complaint rates**: Keep below 0.1%
3. **Remove invalid emails**: Delete bounced email addresses from your database
4. **Use proper unsubscribe**: Include unsubscribe links in marketing emails
5. **Warm up gradually**: If sending large volumes, start small and increase gradually

---

## Troubleshooting

### Problem: "Email address not verified"
**Solution**: You're in sandbox mode. Either:
- Verify the recipient email in SES, OR
- Request production access

### Problem: "Domain not verified"
**Solution**: 
- Check DNS records are added correctly
- Wait 24-48 hours for DNS propagation
- Use DNS checker tools to verify records

### Problem: "Access Denied" or "Invalid credentials"
**Solution**:
- Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct
- Verify IAM user has SES permissions
- Check the region matches

### Problem: "Message rejected: Email address is not verified"
**Solution**:
- Your domain needs to be verified
- Or you need production access

### Problem: Emails going to spam
**Solution**:
- Make sure SPF, DKIM, and DMARC records are set correctly
- Use a proper "From" address (noreply@finflow42.com)
- Don't use spam trigger words in subject lines
- Include unsubscribe links

---

## Cost Estimate

- **Free Tier**: 62,000 emails/month (if sending from EC2)
- **Paid**: $0.10 per 1,000 emails
- **Examples**:
  - 1,000 emails/month = $0.10
  - 5,000 emails/month = $0.50
  - 10,000 emails/month = $1.00
  - 50,000 emails/month = $5.00

---

## Security Checklist

- ✅ Never commit AWS credentials to git
- ✅ Use environment variables only
- ✅ IAM user has minimal permissions (only SES)
- ✅ Enable MFA on your AWS root account
- ✅ Rotate access keys every 90 days
- ✅ Monitor CloudWatch for unusual activity

---

## Next Steps After Setup

1. ✅ Domain verified
2. ✅ Production access approved
3. ✅ IAM user created
4. ✅ Access keys saved
5. ✅ Environment variables added
6. ✅ Test email sent successfully

**You're all set!** Your app will now send emails from `noreply@finflow42.com` via AWS SES.

---

## Support Resources

- **AWS SES Documentation**: https://docs.aws.amazon.com/ses/
- **AWS SES Pricing**: https://aws.amazon.com/ses/pricing/
- **AWS Support**: https://console.aws.amazon.com/support/
- **DNS Checker**: https://mxtoolbox.com/

