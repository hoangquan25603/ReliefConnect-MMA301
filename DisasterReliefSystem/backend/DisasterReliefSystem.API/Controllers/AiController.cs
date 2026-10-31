using System.ComponentModel.DataAnnotations;
using DisasterReliefSystem.API.AI;
using DisasterReliefSystem.API.Data;
using DisasterReliefSystem.API.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DisasterReliefSystem.API.Controllers;

[Authorize, Route("api/ai")]
public sealed class AiController(ReliefClassifier classifier, AppDbContext db) : AppController
{
    public record AnalyzeBody([Required, StringLength(4000, MinimumLength = 3)] string Text);
    [HttpGet("status")]
    public IActionResult Status() => Ok(new { available = true, provider = "Local Naive Bayes", modelVersion = ReliefClassifier.Version,
        classifier.TrainingExamples, categories = ReliefClassifier.Labels.Keys,
        description = "Mô hình học máy Naive Bayes huấn luyện từ ví dụ tiếng Việt tự biên soạn cho đồ án. Chạy tại máy chủ, không gửi dữ liệu ra bên ngoài. Chưa được kiểm định để điều phối cứu trợ thực tế." });
    [HttpPost("analyze")]
    public async Task<IActionResult> Analyze(AnalyzeBody body)
    {
        if (string.IsNullOrWhiteSpace(body.Text)) throw new ApiException(400, "Nhập mô tả nhu cầu để phân tích.");
        var p = classifier.Predict(body.Text);
        var stock = p.HasEvidence ? await db.Inventories.AsNoTracking().Include(i => i.Supply).Include(i => i.Warehouse)
            .Where(i => i.Warehouse.IsActive && i.Quantity > 0 && i.Supply.Category == p.Category)
            .OrderByDescending(i => i.Quantity).Take(10).ToListAsync() : [];
        return Ok(new { category = p.Category, categoryLabel = ReliefClassifier.Labels[p.Category], confidence = p.Confidence,
            probabilities = p.Probabilities.Select(x => new { x.Category, x.Label, probability = x.ProbabilityValue }),
            suggestedItems = stock.Select(i => new { itemName = i.Supply.SupplyName, unit = i.Supply.Unit, availableQuantity = i.Quantity,
                warehouseName = i.Warehouse.WarehouseName, inventoryItemId = i.InventoryId.ToString() }),
            explanation = p.HasEvidence ? "AI đề xuất nhóm nhu cầu dựa trên xác suất từ mô hình đã huấn luyện. Điểm tin cậy là điểm tương đối, không phải độ chính xác thực tế. Vật tư gợi ý được đối chiếu theo nhóm và tồn kho hiện có; cần người phụ trách xác nhận." :
                "Mô hình chưa nhận diện được đủ từ vựng trong mô tả. Hãy mô tả cụ thể vật tư hoặc nhu cầu và nhờ người phụ trách đánh giá.",
            modelVersion = ReliefClassifier.Version, requiresHumanReview = true });
    }
}
