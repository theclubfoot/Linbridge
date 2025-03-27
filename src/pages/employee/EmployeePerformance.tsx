import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface PerformanceReview {
  id: string;
  review_date: string;
  reviewer_id: string;
  rating: number;
  comments: string;
  goals: string;
  reviewer_name?: string;
}

export function EmployeePerformance() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceReviews();
  }, []);

  const fetchPerformanceReviews = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get employee ID
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();

      if (employeeData) {
        // Fetch performance reviews
        const { data: reviewsData, error } = await supabase
          .from('performance_reviews')
          .select(`
            id,
            review_date,
            reviewer_id,
            rating,
            comments,
            goals
          `)
          .eq('employee_id', employeeData.id)
          .order('review_date', { ascending: false });

        if (error) throw error;

        // Fetch reviewer names
        const reviewsWithNames = await Promise.all(
          reviewsData.map(async (review) => {
            const { data: reviewerData } = await supabase
              .from('employees')
              .select('first_name, last_name')
              .eq('id', review.reviewer_id)
              .single();

            return {
              ...review,
              reviewer_name: reviewerData
                ? `${reviewerData.first_name} ${reviewerData.last_name}`
                : 'Unknown Reviewer',
            };
          })
        );

        setReviews(reviewsWithNames);
      }
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'bg-green-100 text-green-800';
    if (rating >= 3) return 'bg-blue-100 text-blue-800';
    if (rating >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Performance Reviews</h1>

      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Performance Review - {format(new Date(review.review_date), 'MMMM d, yyyy')}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Reviewed by {review.reviewer_name}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getRatingColor(
                    review.rating
                  )}`}
                >
                  Rating: {review.rating}/5
                </span>
              </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Comments</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {review.comments}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Goals and Objectives</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {review.goals}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No performance reviews found.
          </div>
        )}
      </div>
    </div>
  );
}
