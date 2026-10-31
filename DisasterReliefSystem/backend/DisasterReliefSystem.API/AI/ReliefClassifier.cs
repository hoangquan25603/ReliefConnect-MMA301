using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace DisasterReliefSystem.API.AI;

/// <summary>Multinomial Naive Bayes learned from checked-in, authored demo examples.
/// Counts, vocabulary, priors and likelihoods are computed at startup; predictions are not keyword rules.
/// Scores are model-relative (not calibrated real-world accuracy). No emergency triage decisions.</summary>
public sealed class ReliefClassifier
{
    public const string Version = "relief-nb-vi-demo-1.0";
    public static readonly Dictionary<string, string> Labels = new() {
        ["Food"] = "Lương thực", ["Water"] = "Nước uống", ["Medicine"] = "Vật tư y tế",
        ["Blanket"] = "Chăn và đồ giữ ấm", ["Shelter"] = "Chỗ ở tạm", ["Other"] = "Hỗ trợ khác" };
    private sealed record Example(string Category, string Text);
    private readonly Dictionary<string, Dictionary<string, int>> counts = new();
    private readonly Dictionary<string, int> totals = new();
    private readonly Dictionary<string, int> documents = new();
    private readonly HashSet<string> vocabulary = new();
    private static readonly HashSet<string> StopWords = new("can chung toi gia dinh nguoi nhieu cac cua va cho de duoc dang tai bi nhung voi mot rat xin hay ho tro khu vuc dan sau bao lu khan cap thieu khong con co trong ngoai".Split(' '));
    public int TrainingExamples { get; }
    public ReliefClassifier(IWebHostEnvironment environment)
    {
        var path = Path.Combine(environment.ContentRootPath, "AI", "training-data.json");
        var data = JsonSerializer.Deserialize<Example[]>(File.ReadAllText(path), new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
        TrainingExamples = data.Length;
        foreach (var label in Labels.Keys) { counts[label] = new(); totals[label] = 0; documents[label] = 0; }
        foreach (var row in data)
        {
            documents[row.Category]++;
            foreach (var word in Tokens(row.Text))
            {
                vocabulary.Add(word); counts[row.Category][word] = counts[row.Category].GetValueOrDefault(word) + 1; totals[row.Category]++;
            }
        }
    }
    private static IEnumerable<string> Tokens(string input)
    {
        var normalized = input.ToLowerInvariant().Replace('đ', 'd').Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized) if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark) sb.Append(c);
        var words = Regex.Matches(sb.ToString(), "[a-z]+").Select(m => m.Value).Where(w => w.Length > 1 && !StopWords.Contains(w)).ToArray();
        foreach (var word in words) yield return word;
        for (var i = 0; i < words.Length - 1; i++) yield return words[i] + "_" + words[i + 1];
    }
    public record Probability(string Category, string Label, double ProbabilityValue);
    public record Prediction(string Category, double Confidence, bool HasEvidence, List<Probability> Probabilities);
    public Prediction Predict(string text)
    {
        var words = Tokens(text).Where(vocabulary.Contains).ToArray();
        if (words.Length == 0) return new Prediction("Other", 0, false,
            Labels.Select(x => new Probability(x.Key, x.Value, 1.0 / Labels.Count)).ToList());
        var scores = Labels.Keys.ToDictionary(category => category, category =>
            Math.Log((documents[category] + 1.0) / (TrainingExamples + Labels.Count)) +
            words.Sum(word => Math.Log((counts[category].GetValueOrDefault(word) + 1.0) / (totals[category] + vocabulary.Count))));
        var max = scores.Values.Max();
        var likelihoods = scores.ToDictionary(x => x.Key, x => Math.Exp((x.Value - max) / 2.0));
        var sum = likelihoods.Values.Sum();
        var probabilities = likelihoods.Select(x => new Probability(x.Key, Labels[x.Key], Math.Round(x.Value / sum, 4)))
            .OrderByDescending(x => x.ProbabilityValue).ToList();
        return new Prediction(probabilities[0].Category, probabilities[0].ProbabilityValue, true, probabilities);
    }
}
