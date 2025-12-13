# AWS SES Setup Guide for FinFlow42

This guide will help you set up AWS SES to send emails from `finflow42.com`.

## Step 1: Create AWS Account

1. Go to https://aws.amazon.com/
2. Sign up for an AWS account (if you don't have one)
3. Complete the verification process

## Step 2: Access AWS SES

1. Log in to AWS Console
2. Navigate to **Simple Email Service (SES)**
3. Make sure you're in the correct region (e.g., `us-east-1`)

## Step 3: Verify Your Domain

### Option A: Verify Domain (Recommended for Production)

1. In SES Console, go to **Verified identities**
2. Click **Create identity**
3. Select **Domain**
4. Enter your domain: `finflow42.com`
5. Click **Create identity**

### DNS Records to Add

AWS will provide you with DNS records to add to your domain:

1. **SPF Record** (TXT):
   ```
   v=spf1 include:amazonses.com ~all
   ```

2. **DKIM Records** (CNAME):
   - AWS will provide 3 CNAME records for DKIM
   - Add all 3 to your DNS

3. **DMARC Record** (TXT) - Optional but recommended:
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@finflow42.com
   ```

4. Add these records to your domain's DNS (wherever you manage DNS - GoDaddy, Cloudflare, etc.)

5. Wait for verification (can take up to 72 hours, usually much faster)

### Option B: Verify Email Address (For Testing)

1. In SES Console, go to **Verified identities**
2. Click **Create identity**
3. Select **Email address**
4. Enter: `noreply@finflow42.com`
5. Check your email and click the verification link

## Step 4: Request Production Access (If Needed)

AWS SES starts in **Sandbox mode** which only allows sending to verified email addresses.

To send to any email address:
1. Go to **Account dashboard** in SES
2. Click **Request production access**
3. Fill out the form explaining your use case
4. Wait for approval (usually 24-48 hours)

## Step 5: Create IAM User for SES

1. Go to **IAM** in AWS Console
2. Click **Users** → **Create user**
3. Username: `finflow42-ses-user`
4. Select **Attach policies directly**
5. Search for and select: `AmazonSESFullAccess` (or create a custom policy with only `ses:SendEmail` permission)
6. Click **Create user**

## Step 6: Create Access Keys

1. Click on the user you just created
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Select **Application running outside AWS**
5. Click **Next** → **Create access key**
6. **IMPORTANT**: Copy both:
   - **Access key ID**
   - **Secret access key** (you can only see this once!)

## Step 7: Add Environment Variables

Add these to your `.env.local` file:

```env
# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_SES_FROM_EMAIL=noreply@finflow42.com
AWS_SES_FROM_NAME=FinFlow42
```

## Step 8: Test Email Sending

1. Make sure your domain/email is verified in SES
2. Try sending a test email (OTP, password reset, etc.)
3. Check the SES console for sending statistics

## Cost Estimate

- **Free Tier**: 62,000 emails/month (if sending from EC2)
- **Paid**: $0.10 per 1,000 emails
- **Example**: 10,000 emails/month = $1.00

## Troubleshooting

### Email not sending?
1. Check AWS credentials are correct
2. Verify domain/email is verified in SES
3. Check SES is out of sandbox mode (if sending to unverified addresses)
4. Check CloudWatch logs in AWS Console

### Domain verification failing?
1. Make sure DNS records are added correctly
2. Wait 24-48 hours for DNS propagation
3. Use DNS checker tools to verify records are live

### Getting "Email address not verified" error?
- You're in Sandbox mode
- Either verify the recipient email or request production access

## Security Best Practices

1. **Never commit AWS credentials to git**
2. Use environment variables only
3. Create IAM user with minimal permissions (only `ses:SendEmail`)
4. Rotate access keys regularly
5. Enable MFA on your AWS account

## Support

- AWS SES Documentation: https://docs.aws.amazon.com/ses/
- AWS SES Pricing: https://aws.amazon.com/ses/pricing/

