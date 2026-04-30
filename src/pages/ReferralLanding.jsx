import { useParams } from 'react-router-dom'

export default function ReferralLanding() {
    const { referralCode } = useParams()
    return (
          <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <h1 className="text-3xl font-bold text-orange-500 mb-4">Miami Knife Guy</h1>
              <p className="text-white text-lg mb-2">You have been referred!</p>
              <p className="text-gray-400 mb-4">Referral code: <span className="text-orange-500 font-bold">{referralCode}</span></p>
              <p className="text-gray-400">Visit us to get your knives sharpened and join our rewards program.</p>
            </div>
          </div>
        )
  }
